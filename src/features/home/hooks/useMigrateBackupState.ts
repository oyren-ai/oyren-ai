/**
 * One-time migration: moves the legacy localStorage workspace map
 * (`oyren_cloud_workspace_map`) into the durable `sync_state.json` file.
 *
 * Call this hook once in the app root (e.g. in App.tsx or a top-level provider).
 * It is safe to call multiple times — the flag `oyren_sync_migrated` prevents
 * the migration from running more than once.
 */

import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const LEGACY_MAP_KEY = 'oyren_cloud_workspace_map';
const MIGRATED_FLAG = 'oyren_sync_migrated';

export function useMigrateBackupState(): void {
  useEffect(() => {
    if (localStorage.getItem(MIGRATED_FLAG) === '1') return;

    const raw = localStorage.getItem(LEGACY_MAP_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }

    let map: Record<string, string>;
    try {
      map = JSON.parse(raw);
    } catch {
      localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }

    if (Object.keys(map).length === 0) {
      localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }

    invoke('migrate_local_storage_workspace_map', { map })
      .then(() => {
        localStorage.setItem(MIGRATED_FLAG, '1');
        // Keep the localStorage entry intact until the user does a first sync,
        // so the legacy backup dialog still shows "previously backed up" correctly.
      })
      .catch((err) => {
        console.warn('[sync-migration] Failed to migrate localStorage map:', err);
        // Will retry on next app launch.
      });
  }, []);
}
