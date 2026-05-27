import React from 'react';
import type { ConversationMessage, ImageData } from '@/types/conversation';
import MdxRenderer from '@/components/common/MdxRenderer';
import FileChip from '@/features/ai-chat/components/FileChip';

interface ConversationMessageBubbleProps {
  message: ConversationMessage;
}

function parseMessageImages(message: ConversationMessage): ImageData[] | undefined {
  if (!message.images) return undefined;
  try {
    return typeof message.images === 'string'
      ? JSON.parse(message.images as unknown as string)
      : message.images;
  } catch {
    return undefined;
  }
}

function resolveImageSource(img: ImageData): string {
  return img.data.startsWith('data:') ? img.data : `data:${img.mime_type};base64,${img.data}`;
}

const ConversationMessageBubble: React.FC<ConversationMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const messageImages = parseMessageImages(message);
  const hasTextContent = message.content && message.content.trim();

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${isUser ? 'flex flex-col items-end' : ''}`}>
        {messageImages && messageImages.length > 0 && (
          <div className={`mb-2 space-y-2 ${isUser ? 'flex flex-col items-end' : ''}`}>
            {messageImages.map((img, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={resolveImageSource(img)}
                  alt={`Snippet ${index + 1}`}
                  className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                  style={{ maxHeight: '200px', maxWidth: '300px' }}
                />
                <div className={`absolute top-1 ${isUser ? 'right-1' : 'left-1'} bg-black/70 text-white text-xs px-2 py-1 rounded`}>
                  Snippet
                </div>
              </div>
            ))}
          </div>
        )}

        {hasTextContent && (
          <div className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
              : 'bg-white/5 backdrop-blur-sm text-foreground border border-white/10'
          }`}>
            <div className="flex-1">
              <MdxRenderer content={message.content} />
              <p className={`text-xs mt-2 ${isUser ? 'text-gray-600 dark:text-gray-300' : 'text-muted-foreground'}`}>
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {message.attached_files && message.attached_files.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {message.attached_files.map((file) => {
              const metadata = JSON.parse(file.metadata);
              return <FileChip key={file.id} fileName={metadata.filename} filePath={metadata.filename} />;
            })}
          </div>
        )}

        {messageImages && messageImages.length > 0 && !hasTextContent && (
          <p className={`text-xs mt-1 ${isUser ? 'text-gray-600 dark:text-gray-300' : 'text-muted-foreground'}`}>
            {new Date(message.created_at).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationMessageBubble;