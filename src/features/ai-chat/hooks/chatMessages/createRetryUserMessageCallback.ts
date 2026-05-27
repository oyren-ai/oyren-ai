import type { ChatMessage } from '../../types';
import type { SendMessageRequest } from './createSendMessageCallback';

export interface RetryUserMessageDependencies {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (request: SendMessageRequest) => void;
}

export function createRetryUserMessageCallback(deps: RetryUserMessageDependencies) {
  return (message: ChatMessage) => {
    const { messages, setMessages, sendMessage } = deps;

    // Ensure messages is an array
    if (!Array.isArray(messages)) return;

    // Find the index of this message
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex === -1) return;

    // Remove this message and all following messages
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // Resend the message
    sendMessage({
      messageTextDisplayedInChatBubble: message.content,
      messageTextWithFileContentsSentToAI: message.messageTextWithFileContentsSentToAI || message.content,
      images: message.images || [],
      answerMode: 'concise', // Default to concise for retry
      files: message.files,
      isRetry: true
    });
  };
}