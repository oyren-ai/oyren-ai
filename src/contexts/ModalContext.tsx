import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TODO } from "@/types/TODO.ts";

// Enum for modal types
export enum ModalType {
  Settings = 'settings',
  ChatSettings = 'chatSettings',
  CreateWorkspace = 'createWorkspace',
  EditWorkspace = 'editWorkspace',
  DeleteWorkspace = 'deleteWorkspace',
  CloudSync = 'cloudSync',
  CreateNote = 'createNote',
  ApiKey = 'apiKey',
  DeleteApiKey = 'deleteApiKey',
}

// Interface for individual modal state
//TODO: can use generic here
interface ModalState {
  isOpen: boolean;
  open: (data?: TODO) => void;
  close: () => void;
  //TODO: do we need this field here?
  data?: TODO;
}

// Context type with all modals grouped
interface ModalContextType {
  modals: {
    [ModalType.Settings]: ModalState;
    [ModalType.ChatSettings]: ModalState;
    [ModalType.CreateWorkspace]: ModalState;
    [ModalType.EditWorkspace]: ModalState;
    [ModalType.DeleteWorkspace]: ModalState;
    [ModalType.CloudSync]: ModalState;
    [ModalType.CreateNote]: ModalState;
    [ModalType.ApiKey]: ModalState;
    [ModalType.DeleteApiKey]: ModalState;
  };
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Base hook for accessing the context
const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

// Generic hook that accepts a modal type
export const useModal = (modalType: ModalType): ModalState => {
  const context = useModalContext();
  return context.modals[modalType];
};

// Specific hooks for each modal (for convenience)
export const useSettingsModal = () => useModal(ModalType.Settings);
export const useChatSettingsModal = () => useModal(ModalType.ChatSettings);
export const useCreateWorkspaceModal = () => useModal(ModalType.CreateWorkspace);
export const useEditWorkspaceModal = () => useModal(ModalType.EditWorkspace);
export const useDeleteWorkspaceModal = () => useModal(ModalType.DeleteWorkspace);
export const useCloudSyncModal = () => useModal(ModalType.CloudSync);
export const useCreateNoteModal = () => useModal(ModalType.CreateNote);
export const useApiKeyModal = () => useModal(ModalType.ApiKey);
export const useDeleteApiKeyModal = () => useModal(ModalType.DeleteApiKey);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  // State for each modal
  const [openModal, setOpenModal] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<TODO>(null);

  // Helper to create modal state object
  const createModalState = (modalType: ModalType): ModalState => ({
    isOpen: openModal === modalType,
    open: (data?: TODO) => {
      setOpenModal(modalType);
      setModalData(data);
    },
    close: () => {
      if (openModal === modalType) {
        setOpenModal(null);
        setModalData(null);
      }
    },
    data: openModal === modalType ? modalData : undefined,
  });

  const value: ModalContextType = {
    modals: {
      [ModalType.Settings]: createModalState(ModalType.Settings),
      [ModalType.ChatSettings]: createModalState(ModalType.ChatSettings),
      [ModalType.CreateWorkspace]: createModalState(ModalType.CreateWorkspace),
      [ModalType.EditWorkspace]: createModalState(ModalType.EditWorkspace),
      [ModalType.DeleteWorkspace]: createModalState(ModalType.DeleteWorkspace),
      [ModalType.CloudSync]: createModalState(ModalType.CloudSync),
      [ModalType.CreateNote]: createModalState(ModalType.CreateNote),
      [ModalType.ApiKey]: createModalState(ModalType.ApiKey),
      [ModalType.DeleteApiKey]: createModalState(ModalType.DeleteApiKey),
    },
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

