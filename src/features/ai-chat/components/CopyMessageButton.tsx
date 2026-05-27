import React, {useState} from 'react';
import {writeText} from '@tauri-apps/plugin-clipboard-manager';
import {Copy, Check} from 'lucide-react';
import {Button} from '@/components/ui/button';

interface CopyMessageButtonProps {
    content: string;
}

/**
 * Button to copy message content as MDX to clipboard
 */
const CopyMessageButton: React.FC<CopyMessageButtonProps> = ({content}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Button
            onClick={handleCopy}
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            title={copied ? "Copied!" : "Copy as MDX"}
            data-testid="copy-mdx-button"
        >
            {copied ? (
                <>
                    Copied!
                </>
            ) : (
                <Copy className="w-4 h-4"/>
            )}
        </Button>
    );
};

export default CopyMessageButton;