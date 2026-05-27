import React from 'react';
import { Settings, FileText, MessageSquare, History, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useConversations } from '@/features/conversation-history/useConversations';
import { formatRelativeTime } from '@/utils/time-utils';
import { browserApi } from '@/api/browserApi';

interface ChatHeaderMenuProps {
  workspaceId?: string;
  onConvertToNote: () => void;
  onOpenSettings: () => void;
  onConversationSelect: (conversationId: string) => void;
  onViewFullHistory: () => void;
  isConverting: boolean;
  hasMessages: boolean;
  children: React.ReactNode;
}

export function ChatHeaderMenu({
  workspaceId,
  onConvertToNote,
  onOpenSettings,
  onConversationSelect,
  onViewFullHistory,
  isConverting,
  hasMessages,
  children,
}: ChatHeaderMenuProps) {
  const { conversations, loading } = useConversations(workspaceId || '');
  const recentConversations = conversations.slice(0, 3);

  const handleReportClick = async () => {
    try {
      await browserApi.openUrl('https://oyren.ai/report');
    } catch (error) {
      console.error('Failed to open report page:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {/* Recent Conversations */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Recent Conversations
        </DropdownMenuLabel>
        {loading ? (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            Loading...
          </div>
        ) : recentConversations.length > 0 ? (
          <>
            {recentConversations.map((conv) => (
              <DropdownMenuItem
                key={conv.id}
                onClick={() => onConversationSelect(conv.id)}
                className="cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{conv.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(conv.updated_at)}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={onViewFullHistory} className="cursor-pointer">
              <History className="w-4 h-4 mr-2" />
              See Full History
            </DropdownMenuItem>
          </>
        ) : (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            No conversations yet
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Save as Note */}
        <DropdownMenuItem
          onClick={onConvertToNote}
          disabled={!hasMessages || isConverting}
        >
          <FileText className="w-4 h-4 mr-2" />
          Save as Markdown Note
        </DropdownMenuItem>

        {/* Report */}
        <DropdownMenuItem onClick={handleReportClick}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Report Issue
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}