import { useState, useCallback } from 'react';
import { conversationApi } from '@/api/conversationApi';
import type { ConversationWithMessages } from '@/types/conversation';

interface DeleteConfirmState {
  id: string;
  title: string;
}

export function useConversationHistoryActions(
  selectedConversationId: string | null,
  setSelectedConversationId: (id: string | null) => void,
  selectedConversation: ConversationWithMessages | null
) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<DeleteConfirmState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((conversationId: string, title: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConversationToDelete({ id: conversationId, title });
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!conversationToDelete) return;
    setIsDeleting(true);
    try {
      await conversationApi.delete(conversationToDelete.id);
      if (selectedConversationId === conversationToDelete.id) {
        setSelectedConversationId(null);
      }
      window.dispatchEvent(new CustomEvent('conversation-deleted', {
        detail: { conversationId: conversationToDelete.id },
      }));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setConversationToDelete(null);
    }
  }, [conversationToDelete, selectedConversationId, setSelectedConversationId]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false);
    setConversationToDelete(null);
  }, []);

  const handlePinConversation = useCallback(async (
    conversationId: string, currentPinState: boolean, event: React.MouseEvent
  ) => {
    event.stopPropagation();
    try {
      await conversationApi.pin(conversationId, !currentPinState);
      window.dispatchEvent(new CustomEvent('conversation-updated', {
        detail: { conversationId },
      }));
    } catch (error) {
      console.error('Error pinning conversation:', error);
      alert('Failed to pin conversation. Please try again.');
    }
  }, []);

  const handleExportConversation = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedConversation) return;
    try {
      let markdown = `# ${selectedConversation.conversation.title}\n\n`;
      markdown += `**Provider:** ${selectedConversation.conversation.provider}\n`;
      markdown += `**Model:** ${selectedConversation.conversation.model}\n`;
      markdown += `**Created:** ${new Date(selectedConversation.conversation.created_at).toLocaleString()}\n`;
      markdown += `**Last Updated:** ${new Date(selectedConversation.conversation.updated_at).toLocaleString()}\n\n---\n\n`;
      selectedConversation.messages.forEach((msg) => {
        const role = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'System';
        const time = new Date(msg.created_at).toLocaleTimeString();
        markdown += `### ${role} (${time})\n\n${msg.content}\n\n---\n\n`;
      });
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${selectedConversation.conversation.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting conversation:', error);
    }
  }, [selectedConversation]);

  return {
    deleteConfirmOpen, conversationToDelete, isDeleting,
    handleDeleteClick, handleDeleteConfirm, handleDeleteCancel,
    handlePinConversation, handleExportConversation,
  };
}