import React from 'react';
import OyrenPdfViewer from '../../features/pdf-viewer/components/OyrenPdfViewer';
import AiChatPanelStateful from '../../features/ai-chat/AiChatPanelStateful';
import { useAppContext } from '../../contexts/AppContext';

export interface PdfViewerLayoutProps {
  className?: string;
}

const PdfViewerLayout: React.FC<PdfViewerLayoutProps> = ({ className }) => {
  const {
    currentPdfPath,
    isDarkMode,
    isSidebarCollapsed,
    sidebarWidth,
    handleMouseDown,
    isAiChatCollapsed,
    setIsAiChatCollapsed,
  } = useAppContext();

  const handleToggleAiChatCollapse = () => setIsAiChatCollapsed(!isAiChatCollapsed);

  return (
    <div className={`flex flex-1 overflow-hidden ${className || ''}`} data-testid="layout-content">
      <div className="flex-1 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 relative flex flex-col" data-testid="pdf-container">
        <div className="flex-1 overflow-auto">
          <OyrenPdfViewer pdfFilePath={currentPdfPath} isDarkMode={isDarkMode} />
        </div>
      </div>
      
      {!isSidebarCollapsed && (
        <>
          <div 
            className="w-1.5 cursor-col-resize bg-gray-200 dark:bg-gray-800 hover:bg-blue-400 transition-colors duration-200"
            onMouseDown={handleMouseDown}
          />
          <div
            className="flex flex-col bg-gray-50 dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 h-full"
            style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}
            data-testid="sidebar"
          >
            <AiChatPanelStateful
              pdfPath={currentPdfPath}
              data-testid="ai-chat-panel"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PdfViewerLayout;