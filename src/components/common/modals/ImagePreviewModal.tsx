import React from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
  imageName?: string;
  imageSize?: { width: number; height: number };
  isDarkMode?: boolean;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageData,
  imageName = 'Image',
  imageSize,
  isDarkMode = false
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (isOpen) {
      // Reset zoom and position when modal opens
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = imageName || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 ${isDarkMode ? 'dark' : ''}`}
      data-testid="image-preview-modal"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="relative w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold" data-testid="image-preview-title">
              {imageName}
            </h3>
            {imageSize && (
              <span className="text-sm text-gray-300" data-testid="image-preview-dimensions">
                {Math.round(imageSize.width)} × {Math.round(imageSize.height)}
              </span>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Zoom Out (-)"
              data-testid="zoom-out-btn"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <span className="text-sm px-2" data-testid="zoom-level">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Zoom In (+)"
              data-testid="zoom-in-btn"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleRotate}
              className="p-2 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Rotate (R)"
              data-testid="rotate-btn"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Download"
              data-testid="download-btn"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-white hover:bg-opacity-20 transition-colors ml-2"
              title="Close (Esc)"
              data-testid="close-preview-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="flex-1 overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          data-testid="image-preview-container"
        >
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`
            }}
          >
            <img
              src={imageData}
              alt={imageName}
              className="max-w-none select-none"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
              draggable={false}
              data-testid="preview-image"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 bg-black bg-opacity-50 text-white text-center text-sm">
          <span className="text-gray-300">
            Use mouse wheel to zoom • Drag to pan • R to rotate • Esc to close
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;