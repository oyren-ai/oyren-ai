import type { ChatMessage } from '../../types';
import type { SendMessageRequest } from './createSendMessageCallback';

export interface RetryErrorMessageDependencies {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (request: SendMessageRequest) => void;
}

export function createRetryErrorMessageCallback(deps: RetryErrorMessageDependencies) {
  return (message: ChatMessage) => {
    const { messages, setMessages, sendMessage } = deps;

    // Ensure messages is an array
    if (!Array.isArray(messages)) return;

    // Find the user message before this error
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex <= 0) return;

    const previousMessage = messages[messageIndex - 1];
    if (previousMessage.type !== 'user') return;

    // Remove the error message
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // Retry the user message
    sendMessage({
      messageTextDisplayedInChatBubble: previousMessage.content,
      messageTextWithFileContentsSentToAI: previousMessage.messageTextWithFileContentsSentToAI || previousMessage.content,
      images: previousMessage.images || [],
      answerMode: 'concise', // Default to concise for retry
      files: previousMessage.files,
      isRetry: true
    });
  };
}