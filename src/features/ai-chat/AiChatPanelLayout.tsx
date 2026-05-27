import React from 'react';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import ImagePreviewModal from './components/ImagePreviewModal';

export interface AiChatPanelLayoutProps {
  'data-testid'?: string;
}

const AiChatPanelLayout: React.FC<AiChatPanelLayoutProps> = ({
  'data-testid': testId
}) => {
  return (
    <div className="flex flex-col h-full relative overflow-hidden  min-w-[320px]" data-testid={testId}>
      <ChatHeader data-testid="chat-header" />
      <ChatMessages />
      <ChatInput />
      <ImagePreviewModal />
    </div>
  );
};

export default AiChatPanelLayout;