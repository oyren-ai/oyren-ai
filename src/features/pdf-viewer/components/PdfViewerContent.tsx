import React from 'react';
import {Plugin, Viewer} from '@react-pdf-viewer/core';
import {FileText} from 'lucide-react';
import {PdfViewerPluginsInstance} from "@/features/pdf-viewer/hooks/usePdfViewerPlugins";

interface PdfViewerContentProps {
    pdfUrl: string;
    plugins: PdfViewerPluginsInstance;
    isDarkMode: boolean;
    currentScale: number;
    onScaleChange: (scale: number) => void;
    onDocumentLoad: (e: any) => void;
    /** Enable dark mode for PDF pages */
    darkBackground?: boolean;
}

const PdfViewerContent: React.FC<PdfViewerContentProps> = ({
    pdfUrl,
    plugins,
    isDarkMode,
    currentScale,
    onScaleChange,
    onDocumentLoad,
    darkBackground = true
}: PdfViewerContentProps) => {
    const pluginInstances: Plugin[] = Object.values(plugins);
    
    // Apply dark mode class when enabled AND app is in dark mode
    const viewerClasses = (darkBackground && isDarkMode) ? 'pdf-dark-viewer' : '';

    return (
        <div className={viewerClasses} style={{ width: '100%', height: '100%' }}>
            <Viewer
                fileUrl={pdfUrl}
                plugins={pluginInstances}
                theme={isDarkMode ? 'dark' : ''}
                defaultScale={currentScale || 0.8}
                onZoom={(e: any) => {
                    onScaleChange(e.scale);
                }}
                onDocumentLoad={onDocumentLoad}
                renderError={() => (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center space-y-2">
                            <FileText className="w-8 h-8 mx-auto text-destructive"/>
                            <p className="text-sm text-destructive">Failed to load PDF</p>
                            <p className="text-xs text-muted-foreground">
                                Please make sure the PDF file is valid and accessible
                            </p>
                        </div>
                    </div>
                )}
            />
        </div>
    );
};

export default PdfViewerContent;