import React, { useRef, useEffect } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import MessageItem from './MessageItem';
import ChatEmptyState from './ChatEmptyState';
import { useAiChatMessagesModel } from '../context/useAiChatMessagesModel';
import { useAiChatContext } from '../context/AiChatContext';
import { useSaveArxivPaper } from '../hooks/useSaveArxivPaper';


const ConversationLoadingState: React.FC = () => (
  <div className="flex-1 overflow-y-auto">
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
 
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
      

      <h3 className="text-lg font-semibold text-foreground mb-2">
        Loading Conversation
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Retrieving your chat history and messages...
      </p>
      
 
      <div className="mt-8 w-full max-w-md space-y-4">
      
        <div className="flex justify-end animate-pulse">
          <div className="w-3/4 h-16 bg-muted rounded-2xl" />
        </div>
     
        <div className="flex justify-start animate-pulse" style={{ animationDelay: '150ms' }}>
          <div className="w-4/5 h-24 bg-muted/60 rounded-2xl" />
        </div>
    
        <div className="flex justify-end animate-pulse" style={{ animationDelay: '300ms' }}>
          <div className="w-2/3 h-12 bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

const ChatMessages: React.FC<{ 'data-testid'?: string }> = ({ 'data-testid': testId }) => {
  const model = useAiChatMessagesModel();
  const { chatState } = useAiChatContext();
  const { savePaper, savingPaperId } = useSaveArxivPaper(chatState.workspaceId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(model.messages.length);

  
  useEffect(() => {
    const container = document.querySelector(`[data-testid="${testId || 'messages-container'}"]`) as HTMLElement | null;
    const isNewMessage = model.messages.length > previousMessageCountRef.current;
    const scrollToBottom = () => {
      if (container && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        container.scrollTop = container.scrollHeight;
      }
    };

    if (isNewMessage) {
      requestAnimationFrame(scrollToBottom);
    } else if (container && messagesEndRef.current) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom || model.messages.length === 1) {
        scrollToBottom();
      }
    }

    previousMessageCountRef.current = model.messages.length;
  }, [model.messages, testId]);


  if (model.isLoadingConversation) {
    return <ConversationLoadingState />;
  }

  if (model.isLoadingHistory) {
    return (
      <div className="flex-1 overflow-y-auto p-4" data-testid={testId}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading chat history...</div>
        </div>
      </div>
    );
  }

  if (model.messages.length === 0) {
    return (
      <ChatEmptyState
        hasApiKey={model.hasApiKey}
        workspaceId={chatState.workspaceId}
        data-testid={testId}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" data-testid={testId || 'messages-container'}>
      <div className="space-y-1 py-4 pt-16 pb-32" data-testid="messages-list">
        {model.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isReasoningExpanded={model.expandedReasoning.has(message.id)}
            onToggleReasoning={() => model.onToggleReasoning(message.id)}
            onRetryUser={() => model.onRetryUserMessage(message)}
            onRetryError={() => model.onRetryErrorMessage(message)}
            onImagePreview={model.onImagePreview}
            onSavePaper={chatState.workspaceId ? savePaper : undefined}
            savingPaperId={savingPaperId}
          />
        ))}

        {model.isLoading && !model.aiError && (() => {
          const lastMessage = model.messages[model.messages.length - 1];
          const waitingForAssistant = !lastMessage || lastMessage.type === 'user';
          if (!waitingForAssistant) return null;
          return (
          <div className="max-w-4xl mx-auto px-4 py-3" data-testid="loading-message">
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking</span>
                <div className="flex gap-1">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
