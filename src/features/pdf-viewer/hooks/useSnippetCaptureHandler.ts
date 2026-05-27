import React from 'react';
import { useSnippetCapture } from './useSnippetCapture';

interface CaptureHandlerProps {
  viewerRef: React.RefObject<HTMLDivElement>;
  onComplete: () => void;
}

export function useSnippetCaptureHandler({ viewerRef, onComplete }: CaptureHandlerProps) {
  const { captureArea, captureCanvas, dispatchImageEvent } = useSnippetCapture();

  const handleCapture = async (
    event: React.MouseEvent,
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    try {
      // Strategy 1: Try to capture from the underlying canvas (Best quality, avoids DOM features)
      const canvases = viewerRef.current?.querySelectorAll('canvas');
      let capturedFromCanvas = false;

      if (canvases && canvases.length > 0) {
        // Find which canvas intersects with our selection
        // The selection bounds are relative to the viewport/overlay
        const overlayRect = event.currentTarget.getBoundingClientRect();
        const selectionRect = {
          left: overlayRect.left + bounds.x,
          top: overlayRect.top + bounds.y,
          width: bounds.width,
          height: bounds.height
        };

        for (let i = 0; i < canvases.length; i++) {
          const canvas = canvases[i];
          const canvasRect = canvas.getBoundingClientRect();

          // Check for intersection
          const intersection = {
            left: Math.max(selectionRect.left, canvasRect.left),
            top: Math.max(selectionRect.top, canvasRect.top),
            right: Math.min(selectionRect.left + selectionRect.width, canvasRect.right),
            bottom: Math.min(selectionRect.top + selectionRect.height, canvasRect.bottom)
          };

          if (intersection.left < intersection.right && intersection.top < intersection.bottom) {
            // We found a canvas that intersects!
            // Calculate crop coordinates relative to the canvas internal resolution
            // Note: canvas.width/height is the internal resolution, rect.width/height is display size
            const scaleX = canvas.width / canvasRect.width;
            const scaleY = canvas.height / canvasRect.height;

            const cropX = (selectionRect.left - canvasRect.left) * scaleX;
            const cropY = (selectionRect.top - canvasRect.top) * scaleY;
            const cropWidth = selectionRect.width * scaleX;
            const cropHeight = selectionRect.height * scaleY;

            const imageData = captureCanvas(canvas, cropX, cropY, cropWidth, cropHeight);
            dispatchImageEvent(imageData, bounds.width, bounds.height);
            capturedFromCanvas = true;
            break; // Stop after capturing the primary underlying canvas
          }
        }
      }

      if (!capturedFromCanvas) {
        console.warn('PDF canvas not found or no intersection, falling back to DOM capture');
        const pdfViewerContainer = viewerRef.current?.querySelector('[data-testid="pdf-worker"] > div > div');
        const targetElement = (pdfViewerContainer || event.currentTarget) as HTMLElement;

        // If falling back to DOM, we need to be careful about bounds
        // If we found container, we try to be precise. If not, we blindly capture overlay coords?
        // Actually, existing logic for container fallbacks was:

        let targetX = bounds.x;
        let targetY = bounds.y;

        if (pdfViewerContainer) {
          const containerRect = pdfViewerContainer.getBoundingClientRect();
          const overlayRect = event.currentTarget.getBoundingClientRect();
          targetX = bounds.x + (overlayRect.left - containerRect.left);
          targetY = bounds.y + (overlayRect.top - containerRect.top);
        }

        const imageData = await captureArea({
          element: targetElement,
          x: targetX,
          y: targetY,
          width: bounds.width,
          height: bounds.height
        });

        dispatchImageEvent(imageData, bounds.width, bounds.height);
      }
    } catch (error) {
      console.error('Error capturing snippet:', error);
    } finally {
      onComplete();
    }
  };

  return { handleCapture };
}