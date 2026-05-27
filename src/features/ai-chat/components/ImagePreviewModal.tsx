import React from 'react';
import { useAiChatContext } from '../context/AiChatContext';

const ImagePreviewModal: React.FC = () => {
  const { uiState, actions } = useAiChatContext();
  const previewImage = uiState.previewImage;

  if (!previewImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-8"
      onClick={actions.onClosePreview}
    >
      <div 
        className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl group"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={previewImage.data}
          alt={previewImage.name}
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {previewImage.name}
        </div>
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {previewImage.size.width} × {previewImage.size.height}
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;