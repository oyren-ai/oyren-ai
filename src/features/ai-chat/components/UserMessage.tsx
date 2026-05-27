import React from 'react';
import FileChip from './FileChip';
import type { ChatMessage } from '../types';

interface UserMessageProps {
  message: ChatMessage;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
}

const UserMessage: React.FC<UserMessageProps> = ({ message, onImagePreview }) => {
  return (
    <div className="flex justify-end">
      <div className="inline-block max-w-[70%]">
        <span className="block text-xs font-semibold text-blue-600 text-right mb-1" data-testid="user-label">You</span>

        {message.images && message.images.length > 0 && (
          <div className="mb-2 space-y-2 flex flex-col items-end">
            {message.images.map((image, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={image.data}
                  alt={`Snippet ${index + 1}`}
                  className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ maxHeight: '200px' }}
                  onClick={() => onImagePreview(image.data, `Snippet ${index + 1}`, image)}
                  title="Click to preview"
                />
                <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Snippet
                </div>
              </div>
            ))}
          </div>
        )}

        {message.content && message.content.trim() && (
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-neutral-200 dark:bg-neutral-700">
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>
        )}

        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end mt-2">
            {message.files.map((file) => (
              <FileChip key={file.id} fileName={file.name} filePath={file.path} />
            ))}
          </div>
        )}

        {message.tokenCount && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
            {message.tokenCount} tokens
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMessage;
