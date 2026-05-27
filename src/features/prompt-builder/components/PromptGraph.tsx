import React from 'react';
import type { PromptBlock } from '@/types/workspacePrompt';
import TextBlock from './TextBlock';
import FileBlock from './FileBlock';
import SpineNode from './SpineNode';

interface PromptGraphProps {
    blocks: PromptBlock[];
    onUpdate: (index: number, block: PromptBlock) => void;
    onRemove: (index: number) => void;
    onChangeFile: (index: number) => void;
}

const PromptGraph: React.FC<PromptGraphProps> = ({ blocks, onUpdate, onRemove, onChangeFile }) => (
    <div className="flex flex-col gap-4" data-testid="prompt-graph">
        {blocks.map((block, i) => (
            <div key={i} className="flex flex-col gap-1.5 animate-block-slide-right opacity-0"
                style={{ animationDelay: `${i * 60}ms` }} data-testid={`graph-row-${i}`}>
                <div className="flex items-center gap-2">
                    <SpineNode index={i} onRemove={() => onRemove(i)} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {block.type === 'text' ? 'Text' : 'File'}
                    </span>
                </div>
                <div className="ml-8">
                    {block.type === 'text' ? (
                        <TextBlock content={block.content ?? ''}
                            onChange={(c) => onUpdate(i, { ...block, content: c })} />
                    ) : (
                        <FileBlock fileName={block.fileName}
                            onChangeFile={() => onChangeFile(i)} />
                    )}
                </div>
            </div>
        ))}
    </div>
);

export default PromptGraph;
