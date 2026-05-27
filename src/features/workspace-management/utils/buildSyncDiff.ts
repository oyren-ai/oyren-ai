/**
 * Pure diff for **manual, additive-only, non-destructive** sync:
 *
 * Active local files:
 *   - Missing on cloud → upload
 *   - Present on both (same sync_id or linked by name) → skip
 *
 * Soft-deleted local files:
 *   - Still tracked via sync_id → mark cloud counterpart as "matched" (skip download)
 *   - Prevents re-downloading files the user explicitly deleted locally
 *
 * Cloud files not matched by any local (active or deleted):
 *   - → download_new (new file from another client)
 *
 * No automatic deletes anywhere in this flow.
 */

import type { CloudFile } from '@/api/syncApi';
import type { WorkspaceFile } from '@/types/workspace';

export type SyncAction =
  | { kind: 'upload_new'; local: WorkspaceFile; assignedSyncId: string }
  | { kind: 'download_new'; cloud: CloudFile }
  | { kind: 'link'; local: WorkspaceFile; cloud: CloudFile; assignedSyncId: string }
  | { kind: 'skip'; local: WorkspaceFile; cloud: CloudFile };

export interface SyncDiff {
  actions: SyncAction[];
  total: number;
}

export interface SyncDiffInput {
  localFiles: WorkspaceFile[];
  cloudFiles: CloudFile[];
  /** Kept for API compatibility; additive-only sync ignores change detection. */
  lastSyncHashes: Map<string, { localHash: string; cloudEtag: string | null }>;
  lastSyncedAt: string | null;
  /** Files that were soft-deleted locally. Their sync_ids suppress re-downloads. */
  deletedFiles?: WorkspaceFile[];
}

function newSyncId(): string {
  return crypto.randomUUID();
}

export function buildSyncDiff(input: SyncDiffInput): SyncDiff {
  const { localFiles, cloudFiles, deletedFiles = [] } = input;
  const actions: SyncAction[] = [];

  const cloudBySyncId = new Map<string, CloudFile>();
  const cloudByName = new Map<string, CloudFile[]>();
  for (const cf of cloudFiles) {
    if (cf.sync_id) cloudBySyncId.set(cf.sync_id, cf);
    const bucket = cloudByName.get(cf.file_name) ?? [];
    bucket.push(cf);
    cloudByName.set(cf.file_name, bucket);
  }

  const matchedCloudUuids = new Set<string>();

  // Phase 1: suppress cloud matches for locally-deleted files (don't re-download)
  for (const deleted of deletedFiles) {
    if (deleted.sync_id) {
      const cloud = cloudBySyncId.get(deleted.sync_id);
      if (cloud) {
        matchedCloudUuids.add(cloud.uuid);
      }
    }
    if (deleted.cloud_file_uuid) {
      matchedCloudUuids.add(deleted.cloud_file_uuid);
    }
  }

  // Phase 2: process active local files
  for (const local of localFiles) {
    if (local.sync_id) {
      const cloud = cloudBySyncId.get(local.sync_id);
      if (!cloud) {
        actions.push({ kind: 'upload_new', local, assignedSyncId: local.sync_id });
        continue;
      }
      matchedCloudUuids.add(cloud.uuid);
      actions.push({ kind: 'skip', local, cloud });
      continue;
    }

    const candidates = cloudByName.get(local.file_name) ?? [];
    const unlinkedCandidates = candidates.filter((c) => !c.sync_id && !matchedCloudUuids.has(c.uuid));

    if (unlinkedCandidates.length >= 1) {
      const cloud =
        unlinkedCandidates.length === 1
          ? unlinkedCandidates[0]
          : unlinkedCandidates.reduce((a, b) => {
              const aDate = a.date_created ?? '';
              const bDate = b.date_created ?? '';
              return bDate > aDate ? b : a;
            });
      matchedCloudUuids.add(cloud.uuid);
      const syncId = newSyncId();
      actions.push({ kind: 'link', local, cloud, assignedSyncId: syncId });
      continue;
    }

    actions.push({ kind: 'upload_new', local, assignedSyncId: newSyncId() });
  }

  // Phase 3: cloud files not matched by any local (active or deleted) → download
  for (const cloud of cloudFiles) {
    if (!matchedCloudUuids.has(cloud.uuid)) {
      actions.push({ kind: 'download_new', cloud });
    }
  }

  return { actions, total: localFiles.length + cloudFiles.length };
}
