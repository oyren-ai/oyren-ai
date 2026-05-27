import React from 'react';
import { FileText } from 'lucide-react';

const EmptyNotesState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No File Selected</h3>
            <p className="text-sm text-muted-foreground">
                Select a file from the list to view or edit it, or create a new note to get started.
            </p>
        </div>
    );
};

export default EmptyNotesState;
