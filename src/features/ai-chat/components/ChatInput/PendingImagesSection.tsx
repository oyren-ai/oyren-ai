import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import type { PendingImage } from '../../types';

interface PendingImagesSectionProps {
  pendingImages: PendingImage[];
  onRemoveImage: (index: number) => void;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
}

export default function PendingImagesSection({
  pendingImages,
  onRemoveImage,
  onImagePreview
}: PendingImagesSectionProps) {
  return (
    <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="w-3 h-3 text-gray-500" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {pendingImages.length} image{pendingImages.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {pendingImages.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image.data}
              alt={`Pending snippet ${index + 1}`}
              className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onImagePreview(image.data, `PDF Snippet ${index + 1}`, image)}
              title="Click to preview"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(index);
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove image"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
