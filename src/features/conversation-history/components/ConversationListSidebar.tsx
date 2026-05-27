import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '@/types/conversation';
import ConversationListItem from '@/features/conversation-history/components/ConversationListItem';

interface ConversationListSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onPinConversation: (conversationId: string, currentPinState: boolean, event: React.MouseEvent) => void;
  onDeleteConversation: (conversationId: string, title: string, event: React.MouseEvent) => void;
  onOpenConversation?: (conversationId: string) => void;
}

const ConversationListSidebar: React.FC<ConversationListSidebarProps> = ({
  conversations, selectedConversationId, onSelectConversation,
  onPinConversation, onDeleteConversation, onOpenConversation,
}) => {
  return (
    <div className="w-80 border-r border-white/10 flex flex-col bg-white/5 backdrop-blur-md" data-testid="conversation-list-sidebar">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-sm text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-2">Start a new chat to see it here</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedConversationId === conv.id}
                onClick={() => onSelectConversation(conv.id)}
                onPin={onPinConversation}
                onDelete={onDeleteConversation}
                onOpen={onOpenConversation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationListSidebar;
