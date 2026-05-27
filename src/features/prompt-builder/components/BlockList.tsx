import React from 'react';
import type { PromptBlock } from '@/types/workspacePrompt';
import TextBlock from './TextBlock';
import FileBlock from './FileBlock';
import BlockActions from './BlockActions';

interface BlockListProps {
    blocks: PromptBlock[];
    onUpdate: (index: number, block: PromptBlock) => void;
    onRemove: (index: number) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    onChangeFile: (index: number) => void;
}

const BlockList: React.FC<BlockListProps> = ({
    blocks, onUpdate, onRemove, onMoveUp, onMoveDown, onChangeFile,
}) => (
    <div className="flex flex-col gap-3">
        {blocks.map((block, i) => (
            <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                    {block.type === 'text' ? (
                        <TextBlock content={block.content ?? ''} onChange={(c) =>
                            onUpdate(i, { ...block, content: c })} />
                    ) : (
                        <FileBlock fileName={block.fileName} onChangeFile={() => onChangeFile(i)} />
                    )}
                </div>
                <BlockActions index={i} total={blocks.length}
                    onMoveUp={() => onMoveUp(i)} onMoveDown={() => onMoveDown(i)}
                    onRemove={() => onRemove(i)} />
            </div>
        ))}
    </div>
);

export default BlockList;
