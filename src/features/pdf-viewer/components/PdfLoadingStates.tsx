import React from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PdfLoadingStatesProps {
  pdfFilePath: string | null;
  pdfUrl: string | null;
}

export const NoPdfSelected: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800">
    <p className="text-gray-500 dark:text-gray-400">No PDF loaded</p>
  </div>
);

interface PdfLoadingProps {
  fileName?: string;
}

export const PdfLoading: React.FC<PdfLoadingProps> = ({ fileName }) => (
  <div className="w-full flex items-center justify-center h-full" data-testid="pdf-loading">
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        {fileName ? `Loading ${fileName}...` : 'Loading PDF document...'}
      </p>
    </div>
  </div>
);

export const EmptyState: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-500">No PDF selected. Click "Open PDF" to select a file.</p>
  </div>
);

const PdfLoadingStates: React.FC<PdfLoadingStatesProps> = ({ pdfFilePath, pdfUrl }) => {
  if (!pdfFilePath) return <NoPdfSelected />;
  if (pdfFilePath && !pdfUrl) return <PdfLoading />;
  return null;
};

export default PdfLoadingStates;