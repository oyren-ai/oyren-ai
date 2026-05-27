import React from 'react';
import AiChatPanelStateful from './AiChatPanelStateful';
import { useAppContext } from '@/contexts/AppContext.tsx';
import { useViewNavigation } from '@/contexts/NavigationContext.tsx';

const AiChatPanelWrapper: React.FC = () => {
    const { currentPdfPath } = useAppContext();
    const { selectedWorkspace } = useViewNavigation();

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden custom-scrollbar">
                <AiChatPanelStateful pdfPath={currentPdfPath} workspaceId={selectedWorkspace?.id} />
            </div>
        </div>
    );
};

export default AiChatPanelWrapper;