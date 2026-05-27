import React from 'react';
import MdxRenderer from '@/components/common/MdxRenderer.tsx';
import { Loader2 } from 'lucide-react';

interface MarkdownViewerProps {
    content: string;
    isLoading?: boolean;
    /** Base path for resolving relative image URLs (e.g. Marker job dir). */
    imageBasePath?: string;
    /** API base URL for fetching images (e.g. https://oyren.ai). */
    imageBaseUrl?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
    content,
    isLoading = false,
    imageBasePath,
    imageBaseUrl,
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading note...</p>
            </div>
        );
    }

    if (!content || content.trim() === '') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-base font-medium text-foreground mb-2">No content yet</p>
                    <p className="text-sm text-muted-foreground">Click the edit button to start writing</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8">
                <MdxRenderer
                content={content}
                className="max-w-4xl mx-auto"
                imageBasePath={imageBasePath}
                imageBaseUrl={imageBaseUrl}
            />
            </div>
        </div>
    );
};

export default MarkdownViewer;