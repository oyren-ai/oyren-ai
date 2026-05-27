import { useEffect } from 'react';
import type { PendingImage } from '../../types';

export interface UseAddImageListenerParams {
  setPendingImages: React.Dispatch<React.SetStateAction<PendingImage[]>>;
}

export const useAddImageListener = ({ setPendingImages }: UseAddImageListenerParams): void => {
  useEffect(() => {
    const handleAddImage = (event: CustomEvent) => {
      const { imageData, width, height } = event.detail;
      console.log(`[useAddImageListener] 📥 Received image: size=${width}x${height}, dataLength=${imageData.length}`);
      setPendingImages((prev) => {
        const newImages = [...prev, { data: imageData, width, height }];
        console.log(`[useAddImageListener] 📋 Total pending images: ${newImages.length}`);
        return newImages;
      });
    };

    window.addEventListener('add-image-to-chat', handleAddImage as EventListener);
    return () => {
      window.removeEventListener('add-image-to-chat', handleAddImage as EventListener);
    };
  }, [setPendingImages]);
};

