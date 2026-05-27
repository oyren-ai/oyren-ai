import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UsePdfLoaderReturn {
  pdfData: Uint8Array | null;
  pdfUrl: string | null;
  pdfLoaded: boolean;
  pageCount: number;
  handleDocumentLoad: (e: any) => void;
}

export function usePdfLoader(pdfFilePath: string | null): UsePdfLoaderReturn {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  // Load PDF data
  useEffect(() => {
    if (!pdfFilePath) {
      setPdfData(null);
      setPdfUrl(null);
      setPdfLoaded(false);
      setPageCount(0);
      return;
    }

    
    invoke<number[]>('read_pdf_file', { filepath: pdfFilePath })
      .then((data) => {
        const uint8Array = new Uint8Array(data);
        setPdfData(uint8Array);
      })
      .catch((error) => {
        console.error('PdfViewerNew: Error loading PDF:', error);
        setPdfData(null);
      });
  }, [pdfFilePath]);

  // Create blob URL when PDF data is available
  useEffect(() => {
    if (!pdfData) {
      setPdfUrl(null);
      return;
    }

    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfData]);

  const handleDocumentLoad = (e: any) => {
    setPdfLoaded(true);
    setPageCount(e.doc.numPages);
  };

  return {
    pdfData,
    pdfUrl,
    pdfLoaded,
    pageCount,
    handleDocumentLoad,
  };
}