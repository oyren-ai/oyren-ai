import { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/layout/WelcomeScreen';
import OyrenPdfViewer from '@/features/pdf-viewer/components/OyrenPdfViewer';
import { PdfLoading } from '@/features/pdf-viewer/components/PdfLoadingStates';
import MarkerMarkdownViewer from '@/features/pdf-viewer/components/MarkerMarkdownViewer';
import { usePdfCacheContext } from '@/contexts/PdfCacheContext';
import { useAppContext } from '@/contexts/AppContext';
import { useScannedPdfDetection } from '../hooks/useScannedPdfDetection';

interface MainContentAreaProps {
  currentPdfPath: string | null;
  isDarkMode: boolean;
  onOpenPdf: () => void;
  onOpenPdfPath: (path: string, workspaceFileId: string) => void;
  workspaceId?: string;
}

export default function MainContentArea({
  currentPdfPath,
  isDarkMode,
  onOpenPdf,
  onOpenPdfPath,
  workspaceId,
}: MainContentAreaProps) {
  const { loadPdf, getCachedPdf, getZoomLevel, setZoomLevel, preloadAdjacentPdfs } = usePdfCacheContext();
  const { openPdfs, currentMarkdownPath, currentMarkdownPdfName, setCurrentMarkdown } = useAppContext();
  const { isPdfScanned } = useScannedPdfDetection();

  const [pdfState, setPdfState] = useState<{ path: string | null, url: string | null, zoom: number }>({
    path: currentPdfPath,
    url: currentPdfPath ? getCachedPdf(currentPdfPath) : null,
    zoom: currentPdfPath ? getZoomLevel(currentPdfPath) : 1
  });

  // Derived state update pattern: if props.currentPdfPath changed, update state immediately
  if (pdfState.path !== currentPdfPath) {
    const cached = currentPdfPath ? getCachedPdf(currentPdfPath) : null;
    const zoom = currentPdfPath ? getZoomLevel(currentPdfPath) : 1;
    setPdfState({
      path: currentPdfPath,
      url: cached,
      zoom
    });
  }

  // Load current PDF if not cached
  useEffect(() => {
    if (!currentPdfPath) return;

    // If url is missing but we have a path, load it
    if (!pdfState.url) {
      loadPdf(currentPdfPath)
        .then(url => {
          // Only update if we are still on the same path
          setPdfState(prev => {
            if (prev.path === currentPdfPath) {
              return { ...prev, url };
            }
            return prev;
          });
        })
        .catch(console.error);
    }
  }, [currentPdfPath, pdfState.url, loadPdf]);

  // Smart preloading: load adjacent tabs in background
  useEffect(() => {
    if (!currentPdfPath || openPdfs.length === 0) return;

    const allPaths = openPdfs.map(pdf => pdf.path);
    preloadAdjacentPdfs(currentPdfPath, allPaths);
  }, [currentPdfPath, openPdfs, preloadAdjacentPdfs]);

  // Show Markdown viewer if active
  if (currentMarkdownPath) {
    return (
      <MarkerMarkdownViewer
        markdownPath={currentMarkdownPath}
        pdfFileName={currentMarkdownPdfName || undefined}
        onClose={() => setCurrentMarkdown(null)}
      />
    );
  }

  // No PDF selected - show welcome screen
  if (!currentPdfPath || openPdfs.length === 0) {
    return (
      <WelcomeScreen
        onOpenPdf={onOpenPdf}
        onOpenPdfPath={onOpenPdfPath}
        isDarkMode={isDarkMode}
      />
    );
  }

  // Render ALL open PDFs, toggle visibility with CSS
  // This keeps each PDF mounted with its own state (scroll, zoom, etc.)
  return (
    <>
      {openPdfs.map((pdf) => {
        const isActive = pdf.path === currentPdfPath;
        const cachedUrl = getCachedPdf(pdf.path);

        // Show loading only for the active PDF if not cached
        if (isActive && !cachedUrl) {
          const fileName = pdf.path.split('/').pop() || 'document.pdf';
          return <PdfLoading key={pdf.path} fileName={fileName} />;
        }

        // Don't render if not loaded yet (inactive tabs)
        if (!cachedUrl) return null;

        return (
          <div
            key={pdf.path}
            style={{
              display: isActive ? 'block' : 'none',
              width: '100%',
              height: '100%',
            }}
          >
            <OyrenPdfViewer
              pdfFilePath={pdf.path}
              pdfUrl={cachedUrl}
              isDarkMode={isDarkMode}
              initialZoom={getZoomLevel(pdf.path)}
              onZoomChange={(zoom) => setZoomLevel(pdf.path, zoom)}
              workspaceId={workspaceId}
            />
          </div>
        );
      })}
    </>
  );
}
