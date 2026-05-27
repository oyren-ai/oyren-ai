import React from 'react';
import { Info, Copy, Check } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWorkspaceInfo } from './useWorkspaceInfo';

const WorkspaceInfoButton: React.FC = () => {
    const {
        selectedWorkspace, copied, editingName, isSaving,
        setEditingName, handleCopy, handleOpenChange, handleSaveName, handleKeyDown,
    } = useWorkspaceInfo();

    if (!selectedWorkspace) return null;

    return (
        <div className="border-l flex-shrink-0 ml-auto">
            <Popover onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 rounded-none p-0">
                        <Info className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-3">
                    <div className="space-y-3">
                        <WorkspaceIdField id={selectedWorkspace.id} copied={copied} onCopy={handleCopy} />
                        <WorkspaceNameField
                            value={editingName} isSaving={isSaving} originalName={selectedWorkspace.name}
                            onChange={setEditingName} onSave={handleSaveName} onKeyDown={handleKeyDown}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

function WorkspaceIdField({ id, copied, onCopy }: { id: string; copied: boolean; onCopy: () => void }) {
    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Workspace ID</p>
            <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded select-all break-all flex-1">{id}</code>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={onCopy}>
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
            </div>
        </div>
    );
}

function WorkspaceNameField({ value, isSaving, originalName, onChange, onSave, onKeyDown }: {
    value: string; isSaving: boolean; originalName: string;
    onChange: (value: string) => void; onSave: () => void; onKeyDown: (e: React.KeyboardEvent) => void;
}) {
    const hasChanged = value.trim() !== '' && value !== originalName;

    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Workspace Name</p>
            <div className="flex items-center gap-2">
                <Input
                    value={value} onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown} onBlur={onSave}
                    className="h-7 text-xs" disabled={isSaving}
                />
                {hasChanged && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={onSave} disabled={isSaving}>
                        Save
                    </Button>
                )}
            </div>
        </div>
    );
}

export default WorkspaceInfoButton;
