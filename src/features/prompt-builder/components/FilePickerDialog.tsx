import React, { useState, useEffect } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { WorkspaceFile } from '@/types/workspace';

interface FilePickerDialogProps {
    workspaceId: string;
    isOpen: boolean;
    onSelect: (fileId: string, fileName: string) => void;
    onClose: () => void;
}

const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
    workspaceId, isOpen, onSelect, onClose,
}) => {
    const [files, setFiles] = useState<WorkspaceFile[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        workspaceFilesApi.listWorkspaceFiles(workspaceId, false)
            .then(setFiles)
            .catch(console.error);
    }, [workspaceId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            data-testid="file-picker-dialog">
            <div className="bg-background rounded-lg border border-border p-4 w-80 max-h-96 overflow-y-auto">
                <h3 className="text-sm font-medium mb-3">Select a file</h3>
                {files.map((f) => (
                    <button key={f.id} onClick={() => { onSelect(f.id, f.file_name); onClose(); }}
                        className="w-full text-left p-2 text-sm rounded hover:bg-accent truncate"
                        data-testid={`file-option-${f.id}`}>
                        {f.file_name}
                    </button>
                ))}
                {files.length === 0 && (
                    <p className="text-sm text-muted-foreground">No files in workspace</p>
                )}
                <button onClick={onClose}
                    className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default FilePickerDialog;
