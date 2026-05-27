import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PdfPreview from './PdfPreview';

interface PdfPreviewModalProps {
  pdfPath: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ pdfPath, isOpen, onClose }) => {
  if (!pdfPath) return null;

  const pdfName = pdfPath.split('/').pop() || 'Unknown PDF';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {pdfName.replace('.pdf', '')}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-4">
          <PdfPreview 
            pdfPath={pdfPath} 
            className="w-full h-[70vh]" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewModal;