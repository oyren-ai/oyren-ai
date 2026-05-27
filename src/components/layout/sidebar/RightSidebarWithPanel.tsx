import React from 'react';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { useRightPanel } from '@/contexts/RightPanelContext';
import RightPanelContainer from './RightPanelContainer';
import RightSidebar from './RightSidebar';

const RightSidebarWithPanel: React.FC = () => {
    const { isPanelOpen } = useRightPanel();

    return (
        <>
            {isPanelOpen && (
                <>
                    <ResizableHandle withHandle />
                    <ResizablePanel
                        defaultSize={30}
                        minSize={26}
                        maxSize={50}
                        className="border-l border-border"
                    >
                        <RightPanelContainer />
                    </ResizablePanel>
                </>
            )}
            <div className="flex-shrink-0 w-12">
                <RightSidebar />
            </div>
        </>
    );
};

export default RightSidebarWithPanel;
