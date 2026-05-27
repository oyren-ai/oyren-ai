import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { History } from 'lucide-react';
import ConversationHistoryView from '@/features/conversation-history/components/ConversationHistoryView';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onOpenConversation?: (conversationId: string) => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen, onClose, workspaceId, onOpenConversation,
}) => {
  const handleOpenConversation = (conversationId: string) => {
    onOpenConversation?.(conversationId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[85vh] flex flex-col p-0 gap-0 bg-background/60 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Chat History</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View and manage your conversation history
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ConversationHistoryView
            workspaceId={workspaceId}
            className="h-full"
            onOpenConversation={handleOpenConversation}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};