import React, { useState, useCallback, useEffect } from 'react';

/**
 * A custom hook to manage the state and logic for a resizable sidebar.
 * @param {number} initialWidth - The initial width of the sidebar.
 * @param {number} minWidth - The minimum width the sidebar can be resized to.
 * @param {number} maxWidth - The maximum width the sidebar can be resized to.
 * @returns {{
 *   sidebarWidth: number,
 *   handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
 * }} - The current width of the sidebar and the mouse down handler to initiate resizing.
 */
export const useResizableSidebar = (initialWidth: number = 384, minWidth: number = 300, maxWidth: number = 800): {
    sidebarWidth: number;
    handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
} => {
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);

  // Starts resizing when the user clicks on the resizer handle.
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Adjusts sidebar width as the user moves the mouse.
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing, minWidth, maxWidth]);

  // Stops resizing when the user releases the mouse button.
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Adds or removes event listeners for resizing based on the `isResizing` state.
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return { sidebarWidth, handleMouseDown };
}; 