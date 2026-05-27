import { useState } from 'react';

export function useSnippetMode() {
  const [isSnippetMode, setIsSnippetMode] = useState<boolean>(false);

  const handleSnippetClick = () => {
    setIsSnippetMode(!isSnippetMode);
    if (!isSnippetMode) {
    }
  };

  return {
    isSnippetMode,
    setIsSnippetMode,
    handleSnippetClick
  };
}