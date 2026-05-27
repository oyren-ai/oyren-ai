import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { HighlightArea, RenderHighlightsProps } from '@react-pdf-viewer/highlight';

import { useScrollPersistence } from '@/hooks/useScrollPersistence';
import { useZoomCoordinator } from '@/features/pdf-viewer/hooks/useZoomCoordinator';
import { usePdfSearch } from '../hooks/usePdfSearch';
import { PDF_ZOOM_CONFIG, normalizeZoomScale } from '@/constants/pdfZoom';
import PdfContainer from './PdfContainer';
import { NoPdfSelected } from './PdfLoadingStates';
import BookmarksDropdown from './BookmarksDropdown';
import OyrenPdfViewerToolbar from './OyrenPdfViewerToolbar';
import { usePdfHighlightRenderers } from '../highlight/PdfHighlightPluginUi';
import { pdfHighlightFill } from '../highlight/pdfHighlightColors';
import { usePdfHighlights } from '../hooks/usePdfHighlights';
import type { PdfHighlightRecord } from '@/lib/pdfHighlightTypes';
import MarkdownViewer from './MarkdownViewer';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import { usePdfLoader } from '../hooks/usePdfLoader';
import { pdfPageCountStore } from '@/stores/pdfPageCountStore';
import { useSnippetMode } from '../hooks/useSnippetMode';
import { usePdfViewerPlugins } from '../hooks/usePdfViewerPlugins';
import { useSmoothPdfZoom } from '../hooks/useSmoothPdfZoom';
import { useSmoothGestureZoom } from '../hooks/useSmoothGestureZoom';

interface PdfViewerNewProps {
    pdfFilePath: string | null;
    pdfUrl?: string | null;
    isDarkMode: boolean;
    initialZoom?: number;
    onZoomChange?: (zoom: number) => void;
    workspaceId?: string;
}

// const OyrenPdfViewer: React.FC<PdfViewerNewProps> = ({ pdfFilePath, isDarkMode }) => {
function OyrenPdfViewer({ pdfFilePath, pdfUrl: externalPdfUrl, isDarkMode, initialZoom = 1, onZoomChange, workspaceId }: PdfViewerNewProps) {
    const { pdfUrl: loadedPdfUrl, handleDocumentLoad } = usePdfLoader(externalPdfUrl ? null : pdfFilePath);
    const pdfUrl = externalPdfUrl || loadedPdfUrl;
    const { isSnippetMode, setIsSnippetMode, handleSnippetClick } = useSnippetMode();
    const [currentScale, setCurrentScale] = useState<number>(initialZoom);
    const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);

    // PDF Dark Mode setting
    const [darkBackground, setDarkBackground] = useState<boolean>(true);

    // Markdown viewer state
    const [showMarkdownViewer, setShowMarkdownViewer] = useState<boolean>(false);
    const [markdownPath, setMarkdownPath] = useState<string | null>(null);

    useScrollPersistence({
        tabId: pdfFilePath || 'no-pdf',
        scrollContainerRef,
        enabled: !!pdfFilePath
    });

    useEffect(() => {
        setCurrentScale(initialZoom);
    }, [initialZoom, pdfFilePath]);

    const {
        highlights: pdfHighlights,
        addHighlight,
        updateHighlightColor,
        removeHighlight,
        primaryArea,
    } = usePdfHighlights(workspaceId, pdfFilePath);

    const { renderHighlightTarget, renderHighlightContent } = usePdfHighlightRenderers(addHighlight);

    const renderHighlights = useCallback(
        (props: RenderHighlightsProps) => (
            <>
                {pdfHighlights.flatMap((h) =>
                    h.areas
                        .filter((a) => a.pageIndex === props.pageIndex)
                        .map((area, idx) => (
                            <div
                                key={`${h.id}-${idx}`}
                                style={{
                                    ...props.getCssProperties(area as HighlightArea, props.rotation),
                                    backgroundColor: pdfHighlightFill(h.colorId),
                                }}
                            />
                        )),
                )}
            </>
        ),
        [pdfHighlights],
    );

    const pdfViewerPluginsInstance = usePdfViewerPlugins({
        renderHighlightTarget,
        renderHighlightContent,
        renderHighlights,
    });

    const onJumpHighlight = useCallback(
        (h: PdfHighlightRecord) => {
            const area = primaryArea(h);
            if (area) {
                pdfViewerPluginsInstance.highlightPlugin.jumpToHighlightArea(area);
            }
        },
        [primaryArea, pdfViewerPluginsInstance.highlightPlugin],
    );

    const pdfSearchState = usePdfSearch({
        searchPluginInstance: pdfViewerPluginsInstance.searchPlugin,
    });

    // Single source of truth for scale
    const getCurrentScale = useCallback(() => currentScale, [currentScale]);

    /**
     * Zoom function that ONLY updates the plugin
     * React state is updated ONLY from Viewer onZoom event (plugin is source of truth)
     * This prevents circular updates and infinite loops
     */
    const handleZoomTo = useCallback((scale: number) => {
        // Normalize scale before applying
        const normalizedScale = normalizeZoomScale(scale);
        // ONLY update plugin - state will be updated via onZoom event
        pdfViewerPluginsInstance.zoomPlugin.zoomTo(normalizedScale);
    }, [pdfViewerPluginsInstance.zoomPlugin]);

    /**
     * Handle zoom events from Viewer (plugin is source of truth)
     * This is the ONLY place where React state is updated from zoom changes
     */
    const handleZoomChange = useCallback((scale: number) => {
        const normalizedScale = normalizeZoomScale(scale);
        setCurrentScale(normalizedScale);
        onZoomChange?.(normalizedScale);
    }, [onZoomChange]);

    // Zoom coordinator for throttled latest-wins commits
    const { requestZoom, flushZoom } = useZoomCoordinator({
        zoomTo: handleZoomTo,
    });

    // Smooth wheel zoom with RAF coalescing
    const { platform } = useSmoothPdfZoom({
        containerRef: viewerRef,
        requestZoom,
        getCurrentScale,
    });

    // Smooth gesture zoom for Safari
    useSmoothGestureZoom({
        containerRef: viewerRef,
        requestZoom,
        flushZoom,
        getCurrentScale,
        platform,
    });

    // Apply cached zoom when document loads
    const handleDocumentLoadWithZoom = (e: any) => {
        handleDocumentLoad(e);
        if (pdfFilePath && e.doc?.numPages) {
            pdfPageCountStore.set(pdfFilePath, e.doc.numPages);
        }
        if (initialZoom !== 1) {
            // Normalize initial zoom before applying
            const normalizedInitialZoom = normalizeZoomScale(initialZoom);
            pdfViewerPluginsInstance.zoomPlugin.zoomTo(normalizedInitialZoom);
        }
    };

    // Zoom controls (use constants and coordinator)
    const handleZoomIn = useCallback(() => {
        const newScale = Math.min(
            PDF_ZOOM_CONFIG.MAX_SCALE,
            getCurrentScale() + PDF_ZOOM_CONFIG.STEP_SIZE
        );
        requestZoom(newScale, 'button');
        flushZoom(); // Immediate commit for button clicks
    }, [getCurrentScale, requestZoom, flushZoom]);

    const handleZoomOut = useCallback(() => {
        const newScale = Math.max(
            PDF_ZOOM_CONFIG.MIN_SCALE,
            getCurrentScale() - PDF_ZOOM_CONFIG.STEP_SIZE
        );
        requestZoom(newScale, 'button');
        flushZoom(); // Immediate commit for button clicks
    }, [getCurrentScale, requestZoom, flushZoom]);

    const handleDownload = () => {
        if (pdfFilePath) {
            const link = document.createElement('a');
            link.href = pdfFilePath;
            link.download = pdfFilePath.split('/').pop() || 'document.pdf';
            link.click();
        }
    };

    const handleToggleBookmarks = () => {
        setShowBookmarks(!showBookmarks);
    };

    const handleSaveBookmark = (text: string, page: number) => {
        console.log('Saving bookmark:', { page, text });
        // TODO: Implement backend bookmark save
        // Form will auto-close in BookmarksDropdown
    };

    if (!pdfFilePath) {
        return <NoPdfSelected />;
    }

    return (
        <div className="w-full h-full flex flex-col overflow-hidden" data-testid="pdf-viewer">
            <OyrenPdfViewerToolbar
                currentScale={currentScale}
                showBookmarks={showBookmarks}
                isSnippetMode={isSnippetMode}
                pdfViewerPluginsInstance={pdfViewerPluginsInstance}
                pdfSearchState={pdfSearchState}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onToggleBookmarks={handleToggleBookmarks}
                onSnippetClick={handleSnippetClick}
                onDownload={handleDownload}
                isDarkMode={isDarkMode}
                darkBackground={darkBackground}
                onToggleDarkBackground={() => setDarkBackground(!darkBackground)}
            />

            {/* PDF Content */}
            <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-neutral-900">
                <div
                    ref={scrollContainerRef}
                    className="flex justify-center h-full overflow-auto p-2 sm:p-8 relative pdf-content-scroll"
                >
                    <div className="overflow-hidden max-w-full">
                        <PdfContainer
                            pdfUrl={pdfUrl}
                            pdfFilePath={pdfFilePath}
                            viewerRef={viewerRef}
                            isSnippetMode={isSnippetMode}
                            setIsSnippetMode={setIsSnippetMode}
                            plugins={pdfViewerPluginsInstance}
                            isDarkMode={isDarkMode}
                            currentScale={currentScale}
                            onScaleChange={handleZoomChange}
                            handleDocumentLoad={handleDocumentLoadWithZoom}
                            darkBackground={darkBackground}
                        />
                    </div>

                    {/* Bookmarks Sidebar - inside PDF content area */}
                    <BookmarksDropdown
                        isVisible={showBookmarks}
                        onClose={() => setShowBookmarks(false)}
                        Bookmarks={pdfViewerPluginsInstance.bookmarkPlugin.Bookmarks}
                        onSaveBookmark={handleSaveBookmark}
                        pageNavigationPlugin={pdfViewerPluginsInstance.pageNavigationPlugin}
                        pdfFilePath={pdfFilePath}
                        highlights={pdfHighlights}
                        onJumpHighlight={onJumpHighlight}
                        onHighlightChangeColor={updateHighlightColor}
                        onHighlightDelete={removeHighlight}
                    />
                </div>
            </div>

            {/* Markdown Viewer Modal */}
            {showMarkdownViewer && markdownPath && (
                <MarkdownViewer
                    markdownPath={markdownPath}
                    pdfFileName={pdfFilePath.split(/[/\\]/).pop() || 'document.pdf'}
                    onClose={() => setShowMarkdownViewer(false)}
                />
            )}
        </div>
    );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render when these specific props actually change
export default React.memo(OyrenPdfViewer, (prevProps, nextProps) => {
    return (
        prevProps.pdfFilePath === nextProps.pdfFilePath &&
        prevProps.pdfUrl === nextProps.pdfUrl &&
        prevProps.isDarkMode === nextProps.isDarkMode &&
        prevProps.initialZoom === nextProps.initialZoom &&
        prevProps.workspaceId === nextProps.workspaceId
    );
});
