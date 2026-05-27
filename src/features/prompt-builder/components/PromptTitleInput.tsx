import React from 'react';

interface PromptTitleInputProps {
    value: string;
    onChange: (value: string) => void;
}

const PromptTitleInput: React.FC<PromptTitleInputProps> = ({ value, onChange }) => (
    <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Prompt title..."
        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
        data-testid="prompt-title-input"
    />
);

export default PromptTitleInput;
