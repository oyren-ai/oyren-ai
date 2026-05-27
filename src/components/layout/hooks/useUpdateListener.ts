import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { UpdateInfo } from '@/api/updaterApi';

interface UseUpdateListenerParams {
  isNewUpdate: boolean;
  setUpdateInfoFromEvent: (info: UpdateInfo) => void;
  openDialog: () => void;
}

export function useUpdateListener({
  isNewUpdate,
  setUpdateInfoFromEvent,
  openDialog,
}: UseUpdateListenerParams) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen<UpdateInfo>('update-available', (event) => {
          console.log('Automatic update notification received:', event.payload);
          setUpdateInfoFromEvent(event.payload);
        });
      } catch (error) {
        console.error('Failed to setup update listener:', error);
      }
    };

    void setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [setUpdateInfoFromEvent]);

  // Auto-open dialog only when a genuinely new update arrives
  useEffect(() => {
    if (isNewUpdate) {
      openDialog();
    }
  }, [isNewUpdate, openDialog]);
}
