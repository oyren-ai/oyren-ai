import React, { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PromptBlock } from '@/types/workspacePrompt';
import { useBlockOperations } from '../hooks/useBlockOperations';
import { useResolvePrompt } from '../hooks/useResolvePrompt';
import PromptTitleInput from './PromptTitleInput';
import PromptGraph from './PromptGraph';
import AddBlockMenu from './AddBlockMenu';
import PromptEditorActions from './PromptEditorActions';
import FilePickerDialog from './FilePickerDialog';

interface PromptEditorViewProps {
    workspaceId: string;
    title: string;
    setTitle: (t: string) => void;
    blocks: PromptBlock[];
    setBlocks: (b: PromptBlock[]) => void;
    isSaving: boolean;
    promptId: string | null;
    onSave: () => void;
    onDelete: () => void;
    onBack: () => void;
}

const PromptEditorView: React.FC<PromptEditorViewProps> = ({
    workspaceId, title, setTitle, blocks, setBlocks,
    isSaving, promptId, onSave, onDelete, onBack,
}) => {
    const ops = useBlockOperations(blocks, setBlocks);
    const { isResolving, resolved, resolveAndCopy } = useResolvePrompt();
    const [filePickerIndex, setFilePickerIndex] = useState<number | null>(null);
    const [showFilePicker, setShowFilePicker] = useState(false);

    const handleAddFile = useCallback(() => {
        setFilePickerIndex(null);
        setShowFilePicker(true);
    }, []);

    const handleChangeFile = useCallback((index: number) => {
        setFilePickerIndex(index);
        setShowFilePicker(true);
    }, []);

    const handleFileSelected = useCallback((fileId: string, fileName: string) => {
        if (filePickerIndex !== null) {
            ops.updateBlock(filePickerIndex, { type: 'file', fileId, fileName });
        } else {
            ops.addFileBlock(fileId, fileName);
        }
    }, [filePickerIndex, ops]);

    return (
        <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
            <Button size="sm" variant="ghost" onClick={onBack} className="self-start"
                data-testid="back-to-list-btn">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <PromptTitleInput value={title} onChange={setTitle} />
            <PromptGraph blocks={blocks} onUpdate={ops.updateBlock}
                onRemove={ops.removeBlock} onChangeFile={handleChangeFile} />
            <AddBlockMenu onAddText={ops.addTextBlock} onAddFile={handleAddFile} />
            <PromptEditorActions isSaving={isSaving} isResolving={isResolving} resolved={resolved}
                canResolve={!!promptId} onSave={onSave}
                onResolve={() => promptId && resolveAndCopy(promptId)}
                onDelete={onDelete} showDelete={!!promptId} />
            <FilePickerDialog workspaceId={workspaceId} isOpen={showFilePicker}
                onSelect={handleFileSelected} onClose={() => setShowFilePicker(false)} />
        </div>
    );
};

export default PromptEditorView;
