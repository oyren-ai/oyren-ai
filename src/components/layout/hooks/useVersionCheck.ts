import { useState, useCallback } from 'react';
import { updaterApi, UpdateInfo } from '@/api/updaterApi';
import { getVersion } from '@tauri-apps/api/app';

const LAST_NOTIFIED_KEY = 'update-last-notified-version';

export function useVersionCheck() {
  const [version, setVersion] = useState<string>('...');
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [lastNotifiedVersion, setLastNotifiedVersion] = useState<string | null>(
    () => localStorage.getItem(LAST_NOTIFIED_KEY)
  );

  const isNewUpdate =
    !!updateInfo?.available &&
    updateInfo.latest_version !== lastNotifiedVersion;

  const dismissUpdate = useCallback((latestVersion: string) => {
    localStorage.setItem(LAST_NOTIFIED_KEY, latestVersion);
    setLastNotifiedVersion(latestVersion);
  }, []);

  const loadVersion = useCallback(async () => {
    try {
      const appVersion = await getVersion();
      setVersion(appVersion);
    } catch (error) {
      console.error('Failed to get app version:', error);
      setVersion('Unknown');
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    try {
      const info = await updaterApi.checkForUpdates();
      setUpdateInfo(info);
      return info;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const setUpdateInfoFromEvent = useCallback((info: UpdateInfo) => {
    setUpdateInfo(info);
  }, []);

  return {
    version,
    loadVersion,
    isChecking,
    updateInfo,
    isNewUpdate,
    checkForUpdates,
    setUpdateInfoFromEvent,
    dismissUpdate,
  };
}
