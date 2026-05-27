import React from 'react';
import { MessageSquare, Trash2, Pin, Download, Calendar, ExternalLink } from 'lucide-react';
import type { ConversationWithMessages } from '@/types/conversation';
import { formatTimestamp } from '@/features/conversation-history/utils/formatConversationDate';
import ConversationMessageBubble from '@/features/conversation-history/components/ConversationMessageBubble';

interface ConversationDetailPanelProps {
  selectedConversation: ConversationWithMessages | null;
  loadingConversation: boolean;
  onPinConversation: (conversationId: string, currentPinState: boolean, event: React.MouseEvent) => void;
  onExportConversation: (event: React.MouseEvent) => void;
  onDeleteConversation: (conversationId: string, title: string, event: React.MouseEvent) => void;
  onOpenConversation?: (conversationId: string) => void;
}

const ConversationDetailPanel: React.FC<ConversationDetailPanelProps> = ({
  selectedConversation, loadingConversation,
  onPinConversation, onExportConversation, onDeleteConversation, onOpenConversation,
}) => {
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Select a conversation to view</p>
        </div>
      </div>
    );
  }

  const { conversation, messages } = selectedConversation;

  return (
    <div className="flex-1 flex flex-col" data-testid="conversation-detail-panel">
      <div className="px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{conversation.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            {formatTimestamp(conversation.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {onOpenConversation && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenConversation(conversation.id); }}
              className="p-2 rounded hover:bg-white/10 text-gray-500 hover:text-primary transition-colors"
              title="Open in chat"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => onPinConversation(conversation.id, conversation.is_pinned, e)}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              conversation.is_pinned ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
            }`}
            title={conversation.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
            data-testid="conversation-detail-pin-button"
          >
            <Pin className={`w-4 h-4 ${conversation.is_pinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onExportConversation}
            className="p-2 rounded hover:bg-white/10 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            title="Export conversation as markdown"
            data-testid="conversation-detail-export-button"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => onDeleteConversation(conversation.id, conversation.title, e)}
            className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete conversation"
            data-testid="conversation-detail-delete-button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loadingConversation ? (
          <div className="text-center text-muted-foreground">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground">No messages in this conversation</div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ConversationMessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationDetailPanel;