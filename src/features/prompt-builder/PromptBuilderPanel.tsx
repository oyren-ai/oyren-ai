import React from 'react';
import { useViewNavigation } from '@/contexts/NavigationContext';
import PromptBuilderPanelLayout from './PromptBuilderPanelLayout';

const PromptBuilderPanel: React.FC = () => {
    const { selectedWorkspace } = useViewNavigation();

    if (!selectedWorkspace) {
        return <div className="p-4 text-sm text-muted-foreground">Select a workspace first</div>;
    }

    return <PromptBuilderPanelLayout workspaceId={selectedWorkspace.id} />;
};

export default PromptBuilderPanel;