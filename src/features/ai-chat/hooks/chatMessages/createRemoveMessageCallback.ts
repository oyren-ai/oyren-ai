import type { ChatMessage } from '../../types';

export interface RemoveMessageDependencies {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function createRemoveMessageCallback(deps: RemoveMessageDependencies) {
  return (messageId: string) => {
    const { setMessages } = deps;
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };
}
