import React from 'react';
import { MessageSquare, Clock, Trash2, Pin } from 'lucide-react';
import { useConversations } from '@/features/conversation-history/useConversations';

interface DatabaseConversationHistoryProps {
  workspaceId: string;
  onConversationSelect?: (conversationId: string) => void;
}

export function DatabaseConversationHistory({
  workspaceId,
  onConversationSelect,
}: DatabaseConversationHistoryProps) {
  const { conversations, loading } = useConversations(workspaceId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Chat History
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Start a new chat to see it here
            </p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onConversationSelect?.(conv.id)}
                className="mb-2 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {conv.is_pinned && <Pin className="w-3 h-3 text-blue-500" />}
                      <h3 className="text-sm font-medium truncate">{conv.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      {conv.provider} • {conv.model}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
