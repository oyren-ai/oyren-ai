import React from 'react';

interface TextBlockProps {
    content: string;
    onChange: (content: string) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ content, onChange }) => (
    <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter prompt text..."
        className="w-full min-h-[60px] p-2 text-xs rounded-md border border-border bg-background
            resize-y focus:ring-1 focus:ring-ring focus:border-ring transition-shadow"
        data-testid="text-block-input"
    />
);

export default TextBlock;
