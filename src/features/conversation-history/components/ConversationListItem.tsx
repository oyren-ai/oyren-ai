import React from 'react';
import { Trash2, Pin, ExternalLink } from 'lucide-react';
import type { Conversation } from '@/types/conversation';
import { formatRelativeDate } from '@/features/conversation-history/utils/formatConversationDate';

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onPin: (conversationId: string, currentPinState: boolean, event: React.MouseEvent) => void;
  onDelete: (conversationId: string, title: string, event: React.MouseEvent) => void;
  onOpen?: (conversationId: string) => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation, isSelected, onClick, onPin, onDelete, onOpen,
}) => {
  const handleOpenClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onOpen?.(conversation.id);
  };

  return (
    <div
      onClick={onClick}
      className={`group p-3 border rounded-lg cursor-pointer transition-all relative ${
        isSelected
          ? 'bg-white/15 border-white/20 backdrop-blur-sm'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/15'
      }`}
      data-testid={`conversation-item-${conversation.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
            {conversation.is_pinned && (
              <Pin className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {conversation.provider} &bull; {conversation.model}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeDate(conversation.updated_at)}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onOpen && (
            <button
              onClick={handleOpenClick}
              className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-primary transition-colors"
              title="Open in chat"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => onPin(conversation.id, conversation.is_pinned, e)}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
              conversation.is_pinned ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
            }`}
            title={conversation.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
            data-testid={`pin-conversation-${conversation.id}`}
          >
            <Pin className={`w-4 h-4 ${conversation.is_pinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => onDelete(conversation.id, conversation.title, e)}
            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete conversation"
            data-testid={`delete-conversation-${conversation.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationListItem;
