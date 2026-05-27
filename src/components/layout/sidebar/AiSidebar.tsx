import React from 'react';
import AiChatPanelStateful from '@/features/ai-chat/AiChatPanelStateful';
import { useAppContext } from '@/contexts/AppContext.tsx';
import { useViewNavigation } from '@/contexts/NavigationContext.tsx';

interface AiSidebarProps {
  className?: string;
  onToggle?: () => void;
}

const AiSidebar: React.FC<AiSidebarProps> = ({ className, onToggle }) => {
  const {
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    currentPdfPath,
  } = useAppContext();

  const { selectedWorkspace } = useViewNavigation();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    onToggle?.();
  };

  if (isSidebarCollapsed) {
    return null;
  }

  return (
    <div
      className={`flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 border-l border-r-0 border-t-0 border-b-0 border-gray-200 dark:border-gray-800 ${className || ''}`}
    >
        <div className="flex-1 overflow-hidden">
          <AiChatPanelStateful pdfPath={currentPdfPath} workspaceId={selectedWorkspace?.id} />
        </div>
    </div>
  );
};

export default AiSidebar;