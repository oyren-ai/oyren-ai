import React from 'react';
import { Worker as PdfWorker } from '@react-pdf-viewer/core';
import PdfViewerContent from './PdfViewerContent';
import SnippetOverlay from './SnippetOverlay';
import { PdfLoading, EmptyState } from './PdfLoadingStates';
import { PdfViewerPluginsInstance } from '@/features/pdf-viewer/hooks/usePdfViewerPlugins';
import { usePdfLinkInterceptor } from '../hooks/usePdfLinkInterceptor';

const Worker = PdfWorker as any;

interface PdfContainerProps {
  pdfUrl: string | null;
  pdfFilePath: string | null;
  viewerRef: React.RefObject<HTMLDivElement>;
  isSnippetMode: boolean;
  setIsSnippetMode: (value: boolean) => void;
  plugins: PdfViewerPluginsInstance;
  isDarkMode: boolean;
  currentScale: number;
  onScaleChange: (scale: number) => void;
  handleDocumentLoad: (e: any) => void;
  darkBackground?: boolean;
}

const PdfContainer: React.FC<PdfContainerProps> = ({
  pdfUrl,
  pdfFilePath,
  viewerRef,
  isSnippetMode,
  setIsSnippetMode,
  plugins,
  isDarkMode,
  currentScale,
  onScaleChange,
  handleDocumentLoad,
  darkBackground = true
}) => {
  usePdfLinkInterceptor(viewerRef, pdfUrl);

  if (!pdfUrl && pdfFilePath) {
    return <PdfLoading />;
  }
  
  if (pdfUrl) {
    return (
      <Worker workerUrl="/pdf-worker/pdf.worker.min.js">
        <div 
          ref={viewerRef}
          className="absolute inset-0"
          style={{ minHeight: '100%' }}
        >
          <PdfViewerContent
            pdfUrl={pdfUrl}
            plugins={plugins}
            isDarkMode={isDarkMode}
            currentScale={currentScale}
            onScaleChange={onScaleChange}
            onDocumentLoad={handleDocumentLoad}
            darkBackground={darkBackground}
          />
          <SnippetOverlay
            isActive={isSnippetMode}
            onDeactivate={() => setIsSnippetMode(false)}
            viewerRef={viewerRef}
          />
        </div>
      </Worker>
    );
  }
  
  return <EmptyState />;
};

export default PdfContainer;