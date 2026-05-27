import React, { useState } from 'react';
import { useConversations } from '@/features/conversation-history/useConversations';
import { useConversationMessages } from '@/features/conversation-history/useConversationMessages';
import { useConversationHistoryActions } from '@/features/conversation-history/hooks/useConversationHistoryActions';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import ConversationListSidebar from '@/features/conversation-history/components/ConversationListSidebar';
import ConversationDetailPanel from '@/features/conversation-history/components/ConversationDetailPanel';

interface ConversationHistoryViewProps {
  workspaceId: string;
  className?: string;
  onOpenConversation?: (conversationId: string) => void;
}

const ConversationHistoryView: React.FC<ConversationHistoryViewProps> = ({
  workspaceId, className, onOpenConversation,
}) => {
  const { conversations, loading: loadingList } = useConversations(workspaceId);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { data: selectedConversation, loading: loadingConversation } =
    useConversationMessages(selectedConversationId || '');

  const actions = useConversationHistoryActions(
    selectedConversationId, setSelectedConversationId, selectedConversation
  );

  if (loadingList) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`} data-testid="conversation-history-loading">
        <div className="text-gray-500">Loading conversation history...</div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${className || ''}`} data-testid="conversation-history-view">
      <ConversationListSidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        onPinConversation={actions.handlePinConversation}
        onDeleteConversation={actions.handleDeleteClick}
        onOpenConversation={onOpenConversation}
      />

      <ConversationDetailPanel
        selectedConversation={selectedConversation}
        loadingConversation={loadingConversation}
        onPinConversation={actions.handlePinConversation}
        onExportConversation={actions.handleExportConversation}
        onDeleteConversation={actions.handleDeleteClick}
        onOpenConversation={onOpenConversation}
      />

      <ConfirmDialog
        isOpen={actions.deleteConfirmOpen}
        onClose={actions.handleDeleteCancel}
        onConfirm={actions.handleDeleteConfirm}
        title="Delete Conversation"
        description={
          actions.conversationToDelete
            ? `Are you sure you want to delete "${actions.conversationToDelete.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this conversation?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actions.isDeleting}
      />
    </div>
  );
};

export default ConversationHistoryView;