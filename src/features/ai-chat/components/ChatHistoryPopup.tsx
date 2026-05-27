import React from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { useConversations } from '@/features/conversation-history/useConversations';
import { formatRelativeTime } from '@/utils/time-utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface ChatHistoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onConversationSelect?: (conversationId: string) => void;
  onViewAllHistory?: () => void;
}

export const ChatHistoryPopup: React.FC<ChatHistoryPopupProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onConversationSelect,
  onViewAllHistory,
}) => {
  const { conversations, loading } = useConversations(workspaceId);

  if (!isOpen) return null;

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect?.(conversationId);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <Card className="absolute top-14 left-4 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200 bg-background/80 backdrop-blur-xl border-white/20 dark:border-white/10">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Chat History</CardTitle>
        </CardHeader>

        <Separator />

        <CardContent className="p-0 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start chatting to see your history here
              </p>
            </div>
          ) : (
            conversations.map((conv, index) => (
              <React.Fragment key={conv.id}>
                <Button
                  variant="ghost"
                  onClick={() => handleConversationClick(conv.id)}
                  className="w-full justify-start h-auto px-4 py-3 rounded-none"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate mb-1">
                      {conv.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(conv.updated_at)}
                    </p>
                  </div>
                </Button>
                {index < conversations.length - 1 && <Separator />}
              </React.Fragment>
            ))
          )}
        </CardContent>

        <Separator />

        <CardFooter className="px-4 py-3 bg-muted/20">
          <Button
            variant="ghost"
            onClick={() => {
              onViewAllHistory?.();
              onClose();
            }}
            className="w-full justify-start text-sm h-auto py-2"
          >
            <Clock className="w-4 h-4 mr-2" />
            <span>View All History</span>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};
