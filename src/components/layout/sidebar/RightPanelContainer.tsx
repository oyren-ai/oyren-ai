import React from 'react';
import { useRightPanel } from '@/contexts/RightPanelContext';
import { cn } from '@/utils/cn';

// Lazy load panels
const AiChatPanelWrapper = React.lazy(() => import('@/features/ai-chat/AiChatPanelWrapper.tsx'));
const MdxNotesPanel = React.lazy(() => import('@/features/notes/mdx-notes'));
const LatexNotesPanel = React.lazy(() => import('@/features/notes/latex-notes/LatexNotesPanel'));
const MarkdownViewerPanel = React.lazy(() => import('@/features/markdown-viewer/MarkdownViewerPanel'));
const ArxivSearchPanel = React.lazy(() => import('@/features/arxiv-search/ArxivSearchPanel'));
const PromptBuilderPanel = React.lazy(() => import('@/features/prompt-builder/PromptBuilderPanel'));

interface RightPanelContainerProps {
    className?: string;
}

const RightPanelContainer: React.FC<RightPanelContainerProps> = ({ className }) => {
    const { activePanel, isPanelOpen } = useRightPanel();

    if (!isPanelOpen) {
        return null;
    }

    const renderPanel = () => {
        switch (activePanel) {
            case 'ai-chat':
                return <AiChatPanelWrapper />;
            case 'mdx-notes':
                return <MdxNotesPanel />;
            case 'notes': // Legacy fallback
                return <MdxNotesPanel />;
            case 'latex-notes':
                return <LatexNotesPanel />;
            case 'markdown-viewer':
                return <MarkdownViewerPanel />;
            case 'arxiv-search':
                return <ArxivSearchPanel />;
            case 'prompt-builder':
                return <PromptBuilderPanel />;
            default:
                return null;
        }
    };

    return (
        <div
            className={cn(
                'h-full w-full bg-neutral-50 dark:bg-neutral-900 border-l border-gray-200 dark:border-gray-800',
                'flex flex-col',
                className
            )}
        >
            <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                {renderPanel()}
            </React.Suspense>
        </div>
    );
};

export default RightPanelContainer;