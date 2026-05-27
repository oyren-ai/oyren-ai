import React from 'react';
import Editor from '@monaco-editor/react';
import { useAppContext } from '@/contexts/AppContext.tsx';
import { Loader2, Save } from 'lucide-react';
import { registerLatexLanguage } from './monacoLatexLanguage.ts';

interface NoteEditorProps {
    content: string;
    onChange: (content: string) => void;
    isSaving: boolean;
    isLoading: boolean;
    /** 'markdown' | 'latex' - controls Monaco language and label */
    language?: 'markdown' | 'latex';
}

const NoteEditor: React.FC<NoteEditorProps> = ({
    content,
    onChange,
    isSaving,
    isLoading,
    language = 'markdown'
}) => {
    const { isDarkMode } = useAppContext();

    const handleEditorChange = (value: string | undefined) => {
        onChange(value || '');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'latex' ? 'LaTeX Editor' : 'Markdown Editor'}</span>
                {isSaving && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Save className="w-3 h-3" />
                        <span>Saving...</span>
                    </div>
                )}
            </div>

            <div className="flex-1">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    value={content}
                    onChange={handleEditorChange}
                    theme={isDarkMode ? 'vs-dark' : 'light'}
                    beforeMount={(monaco) => {
                        if (language === 'latex') registerLatexLanguage(monaco);
                    }}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        padding: { top: 16, bottom: 16 }
                    }}
                />
            </div>
        </div>
    );
};

export default NoteEditor;