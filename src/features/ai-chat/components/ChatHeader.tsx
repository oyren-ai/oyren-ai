import React, { useState } from 'react';
import { Plus, AlertCircle, MoreVertical } from 'lucide-react';
import { ChatHistoryModal } from './ChatHistoryModal';
import { ChatHeaderMenu } from './ChatHeaderMenu';
import ChatContextInfo from './ChatContextInfo';
import { useAiChatHeaderModel } from '../context/useAiChatHeaderModel';
import { useConvertConversationToNote } from '../hooks/useConvertConversationToNote';
import { useAiChatContext } from '../context/AiChatContext';
import { Button } from '@/components/ui/button';

// Container Component (wraps presenter, uses context)
const ChatHeaderContainer: React.FC<{ 'data-testid'?: string }> = (props) => {
  const model = useAiChatHeaderModel();
  const { chatState, modelState } = useAiChatContext();
  const { convertToNote, isConverting } = useConvertConversationToNote();
  const [isFullHistoryOpen, setIsFullHistoryOpen] = useState(false);

  const handleConversationSelect = (conversationId: string) => {
    void model.onLoadConversation(conversationId);
  };

  const handleViewFullHistory = () => {
    setIsFullHistoryOpen(true);
  };

  const handleConvertToNote = async () => {
    if (!model.workspaceId || chatState.messages.length === 0) {
      return;
    }

    const file = await convertToNote({
      messages: chatState.messages,
      workspaceId: model.workspaceId,
      provider: modelState.currentProvider || undefined,
      model: modelState.currentModel,
      totalTokens: model.totalTokens,
      inputTokens: model.inputTokens,
      outputTokens: model.outputTokens,
    });

    if (file) {
      // Success notification could be added here
      console.log('Conversation converted to note:', file.file_name);
    }
  };

  return (
    <div data-testid={props['data-testid']}>
      {/* Full Chat History Modal */}
      <ChatHistoryModal
        isOpen={isFullHistoryOpen}
        onClose={() => setIsFullHistoryOpen(false)}
        workspaceId={model.workspaceId || ''}
        onOpenConversation={handleConversationSelect}
      />

      {/* Floating New Chat Button - Top Right */}
      <Button
        onClick={model.onNewChat}
        variant="outline"
        className="absolute top-4 right-4 z-10 h-8 px-2.5 rounded-full bg-background/80 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-background/90 transition-all gap-1.5 text-xs sm:text-sm"
        title="Start new chat"
        data-testid="new-chat-button"
      >
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">New Chat</span>
        <span className="sm:hidden">New</span>
      </Button>

      {/* Floating Status Indicator - Top Left */}
      <div className="absolute top-4 left-4 z-10 h-8 px-2 sm:px-3 rounded-full bg-background/80 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 sm:gap-2 text-xs max-w-[calc(100%-110px)] sm:max-w-[calc(100%-130px)] overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          {model.hasApiKey ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">AI Ready</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-orange-500 rounded-full hidden md:block"></div>
              <span className="text-xs text-orange-600 dark:text-orange-400 whitespace-nowrap hidden lg:inline">AI Not Configured</span>
              <span className="text-xs text-orange-600 dark:text-orange-400 whitespace-nowrap hidden sm:inline lg:hidden">No API Key</span>
              <span className="text-xs text-orange-600 dark:text-orange-400 whitespace-nowrap sm:hidden">Setup</span>
            </>
          )}
        </div>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 shrink-0"></div>
        <ChatContextInfo
          totalTokens={model.totalTokens}
          inputTokens={model.inputTokens}
          outputTokens={model.outputTokens}
          contextFiles={model.contextFiles}
        />

        {model.aiError && (
          <>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 shrink-0"></div>
            <Button
              variant="ghost"
              size="icon"
              className="h-auto w-auto p-0 text-red-500 hover:text-red-600 hover:bg-transparent shrink-0"
              title={model.aiError}
              data-testid="ai-error-indicator"
            >
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </>
        )}

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 shrink-0"></div>

        {/* Menu Button */}
        <ChatHeaderMenu
          workspaceId={model.workspaceId}
          onConvertToNote={handleConvertToNote}
          onOpenSettings={model.onOpenSettings}
          onConversationSelect={handleConversationSelect}
          onViewFullHistory={handleViewFullHistory}
          isConverting={isConverting}
          hasMessages={chatState.messages.length > 0}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-auto w-auto p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-transparent shrink-0"
            title="Menu"
            data-testid="menu-button"
          >
            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </ChatHeaderMenu>
      </div>
    </div>
  );
};

export default ChatHeaderContainer;