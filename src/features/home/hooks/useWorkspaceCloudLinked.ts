import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCloudWorkspaceUuid } from './useBackupWorkspace';

interface SyncState {
  workspaces: Record<string, { cloud_uuid: string }>;
}

/** True if this local workspace is linked to a cloud workspace (sync state or legacy map). */
export function useWorkspaceCloudLinked(localWorkspaceId: string): boolean {
  const [linked, setLinked] = useState(() => getCloudWorkspaceUuid(localWorkspaceId) !== null);

  useEffect(() => {
    let cancelled = false;
    invoke<SyncState>('get_sync_state')
      .then((state) => {
        if (cancelled) return;
        const uuid = state.workspaces[localWorkspaceId]?.cloud_uuid;
        if (uuid) {
          setLinked(true);
          return;
        }
        setLinked(getCloudWorkspaceUuid(localWorkspaceId) !== null);
      })
      .catch(() => {
        if (!cancelled) setLinked(getCloudWorkspaceUuid(localWorkspaceId) !== null);
      });
    return () => {
      cancelled = true;
    };
  }, [localWorkspaceId]);

  return linked;
}
