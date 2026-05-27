import React, { useState, useEffect } from 'react';
import { pdfApi } from '@/api/pdfApi';
import { FileText, AlertCircle } from 'lucide-react';

interface PdfPreviewProps {
  pdfPath: string;
  className?: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ pdfPath, className = '' }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generatePreview();
    
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [pdfPath]);

  const generatePreview = async () => {
    if (!pdfPath) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Clean up previous URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // Read PDF file
      const fileData = await pdfApi.readPdfFile(pdfPath);
      if (!fileData || fileData.length === 0) {
        throw new Error('Could not read PDF file');
      }

      // Convert to Uint8Array and create blob
      const uint8Array = new Uint8Array(fileData);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      setError('Could not load PDF preview');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Preview unavailable</p>
        </div>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">No preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <iframe
        src={`${previewUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-full"
        style={{ minHeight: '200px' }}
        title="PDF Preview"
      />
    </div>
  );
};

export default PdfPreview;