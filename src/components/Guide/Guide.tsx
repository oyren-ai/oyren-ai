import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface GuideProps {
  lightImage?: string;
  darkImage?: string;
  text: string;
  hoverText?: string;
}

const useAutoHideHintAfterDelay = () => {
  const [showHint, setShowHint] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay 1 second before showing
    const showTimer = setTimeout(() => {
      setShowHint(true);
      // Small delay for fade-in effect
      setTimeout(() => setIsVisible(true), 10);
    }, 1000);

    // Hide after 4 seconds total (1s delay + 3s visible)
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Remove from DOM after fade-out completes
      setTimeout(() => setShowHint(false), 300);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return { showHint, isVisible };
};

const Guide: React.FC<GuideProps> = ({ lightImage, darkImage, text, hoverText }) => {
  const { isDarkMode } = useAppContext();
  const { showHint, isVisible } = useAutoHideHintAfterDelay();
  const [isHovering, setIsHovering] = useState(false);

  // Determine which image to show
  const imageToShow = (() => {
    if (lightImage && darkImage) {
      return isDarkMode ? darkImage : lightImage;
    }
    return lightImage || darkImage;
  })();

  return (
    <div
      className="relative border-2 border-border rounded-lg p-4 bg-muted/30 space-y-3 cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Hover hint animation */}
      {showHint && (
        <div
          className={`absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium shadow-lg transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          hover me
        </div>
      )}

      {/* Hover text overlay with blur */}
      {isHovering && hoverText && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-background/80 rounded-lg z-10 transition-all duration-300">
          <p className="text-sm text-center text-foreground px-4 max-w-full">
            {hoverText}
          </p>
        </div>
      )}

      {imageToShow && (
        <div className="overflow-hidden rounded-md">
          <img
            src={imageToShow}
            alt="Guide illustration"
            className="w-full h-auto"
          />
        </div>
      )}
      <p className="text-sm text-center text-muted-foreground">
        {text}
      </p>
    </div>
  );
};

export default Guide;
