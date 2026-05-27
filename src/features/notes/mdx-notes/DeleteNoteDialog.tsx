import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteNoteDialogProps {
    open: boolean;
    noteName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

const DeleteNoteDialog: React.FC<DeleteNoteDialogProps> = ({
    open,
    noteName,
    onConfirm,
    onCancel,
    isDeleting = false,
}) => {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent data-testid="delete-note-dialog">
                <DialogHeader>
                    <DialogTitle>Delete Note</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{noteName}"? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteNoteDialog;