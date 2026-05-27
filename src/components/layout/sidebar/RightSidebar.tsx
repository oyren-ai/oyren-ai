import React from 'react';
import { MessageSquare, FileCode, FileText, BookOpen, Blocks } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useRightPanel } from '@/contexts/RightPanelContext';
import { Button } from '@/components/ui/button';

interface RightSidebarProps {
    className?: string;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ className }) => {
    const { activePanel, togglePanel } = useRightPanel();

    const panels = [
        { id: 'ai-chat', icon: MessageSquare, label: 'AI Chat' },
        { id: 'mdx-notes', icon: FileText, label: 'Notes' },
        { id: 'latex-notes', icon: FileCode, label: 'LaTeX Notes' },
        { id: 'arxiv-search', icon: BookOpen, label: 'ArXiv Search' },
        { id: 'prompt-builder', icon: Blocks, label: 'Prompt Builder' },
    ];

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-2 py-4 px-2',
                'bg-background border-l border-border',
                'w-12 h-full',
                className
            )}
        >
            {panels.map(({ id, icon: Icon, label }) => (
                <Button
                    key={id}
                    variant={activePanel === id ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => togglePanel(id)}
                    className="w-9 h-9"
                    title={label}
                    aria-label={label}
                    data-testid={`right-panel-${id}`}
                >
                    <Icon className="w-5 h-5" />
                </Button>
            ))}
        </div>
    );
};

export default RightSidebar;