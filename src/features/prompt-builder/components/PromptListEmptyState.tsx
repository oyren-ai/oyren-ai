import React from 'react';
import { Type, FileText, Copy, Blocks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromptListEmptyStateProps {
    onNew: () => void;
}

const features = [
    { icon: Blocks, text: 'Compose prompts from reusable blocks' },
    { icon: FileText, text: 'Attach file contents as context' },
    { icon: Copy, text: 'Copy fully resolved prompt to clipboard' },
];

const MiniDiagram: React.FC = () => (
    <div className="flex flex-col gap-1.5 w-full max-w-[180px] mx-auto">
        {[
            { icon: Type, label: 'Text block', color: 'border-blue-500/30 bg-blue-500/5' },
            { icon: FileText, label: 'File block', color: 'border-amber-500/30 bg-amber-500/5' },
            { icon: Type, label: 'Text block', color: 'border-blue-500/30 bg-blue-500/5' },
        ].map((block, i) => (
            <div
                key={i}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs
                    text-muted-foreground ${block.color} animate-block-slide-right opacity-0`}
                style={{ animationDelay: `${i * 100}ms` }}
            >
                <block.icon className="w-3 h-3 shrink-0" />
                {block.label}
            </div>
        ))}
    </div>
);

const PromptListEmptyState: React.FC<PromptListEmptyStateProps> = ({ onNew }) => (
    <div className="flex flex-col items-center gap-4 px-4 py-6 text-center animate-block-slide-right opacity-0">
        <MiniDiagram />
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
            Build reusable prompts by combining text and file content blocks
        </p>
        <ul className="flex flex-col gap-2 text-left w-full">
            {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <f.icon className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                    {f.text}
                </li>
            ))}
        </ul>
        <Button onClick={onNew} size="sm" className="w-full mt-1" data-testid="empty-new-prompt-btn">
            <Plus className="w-4 h-4 mr-1" /> New Prompt
        </Button>
    </div>
);

export default PromptListEmptyState;
