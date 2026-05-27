import OyrenPdfViewer from '@/features/pdf-viewer/components/OyrenPdfViewer';
import { cn } from '@/lib/utils';

interface PdfTabPanelProps {
  pdfPath: string;
  isActive: boolean;
  cachedUrl: string;
  isDarkMode: boolean;
  initialZoom: number;
  onZoomChange: (zoom: number) => void;
  isScanned: boolean;
}

export default function PdfTabPanel({
  pdfPath,
  isActive,
  cachedUrl,
  isDarkMode,
  initialZoom,
  onZoomChange,
  isScanned,
}: PdfTabPanelProps) {
  return (
    <div
      className={cn(isScanned && 'ring-2 ring-green-400 ring-inset rounded-sm')}
      style={{
        display: isActive ? 'block' : 'none',
        width: '100%',
        height: '100%',
      }}
    >
      <OyrenPdfViewer
        pdfFilePath={pdfPath}
        pdfUrl={cachedUrl}
        isDarkMode={isDarkMode}
        initialZoom={initialZoom}
        onZoomChange={onZoomChange}
      />
    </div>
  );
}
