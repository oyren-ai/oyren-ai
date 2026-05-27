import React from 'react';

interface SnippetCursorProps {
  isActive: boolean;
}

const SnippetCursor: React.FC<SnippetCursorProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <style>
      {`
        .snippet-overlay {
          cursor: crosshair !important;
        }
        .snippet-overlay * {
          cursor: crosshair !important;
        }
      `}
    </style>
  );
};

export default SnippetCursor;