import React from 'react';
import SettingsModal from '../common/modals/SettingsModal';
import ChatSettingsModal from '../common/modals/ChatSettingsModal';
import { CreateWorkspaceDialog } from '@/features/home/components';
import { EditWorkspaceDialog } from '@/features/home/components';
import { DeleteWorkspaceDialog } from '@/features/home/components';
import { SyncWorkspaceDialog } from '@/features/home/components';

import {
  useSettingsModal,
  useChatSettingsModal,
  useCreateWorkspaceModal,
  useEditWorkspaceModal,
  useDeleteWorkspaceModal,
  useCloudSyncModal,
  useApiKeyModal,
  useDeleteApiKeyModal
} from '../../contexts/ModalContext';
import { ApiKeyDialog } from '@/features/settings/components/ApiKeyDialog';
import { DeleteApiKeyDialog } from '@/features/settings/components/DeleteApiKeyDialog';

const ModalManager: React.FC = () => {
  const settingsModal = useSettingsModal();
  const chatSettingsModal = useChatSettingsModal();
  const createWorkspaceModal = useCreateWorkspaceModal();
  const editWorkspaceModal = useEditWorkspaceModal();
  const deleteWorkspaceModal = useDeleteWorkspaceModal();
  const cloudSyncModal = useCloudSyncModal();
  const apiKeyModal = useApiKeyModal();
  const deleteApiKeyModal = useDeleteApiKeyModal();

  return (
    <>
      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
      />
      <ChatSettingsModal
        isOpen={chatSettingsModal.isOpen}
        onClose={chatSettingsModal.close}
        currentTemperature={chatSettingsModal.data?.currentTemperature ?? 0.7}
        onSettingsChange={chatSettingsModal.data?.onSettingsChange ?? (() => { })}
      />
      <CreateWorkspaceDialog
        isOpen={createWorkspaceModal.isOpen}
        onClose={createWorkspaceModal.close}
      />
      <EditWorkspaceDialog
        isOpen={editWorkspaceModal.isOpen}
        onClose={editWorkspaceModal.close}
      />
      <DeleteWorkspaceDialog
        isOpen={deleteWorkspaceModal.isOpen}
        onClose={deleteWorkspaceModal.close}
      />
      <SyncWorkspaceDialog
        isOpen={cloudSyncModal.isOpen}
        onClose={cloudSyncModal.close}
      />
      <ApiKeyDialog
        isOpen={apiKeyModal.isOpen}
        onClose={apiKeyModal.close}
      />
      <DeleteApiKeyDialog
        isOpen={deleteApiKeyModal.isOpen}
        onClose={deleteApiKeyModal.close}
      />
    </>
  );
};

export default ModalManager;
