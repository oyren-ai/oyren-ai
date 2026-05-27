import { useCallback } from 'react';
import { useViewNavigation } from '@/contexts/NavigationContext';
import { useWorkspaceFiles } from '@/features/workspace-management/hooks/useWorkspaceFiles';
import { useConversionStatus } from '@/features/workspace-management/hooks/useConversionStatus';

export function useScannedPdfDetection() {
  const { selectedWorkspace } = useViewNavigation();
  const { files } = useWorkspaceFiles(selectedWorkspace);
  const { hasConversion } = useConversionStatus(files);

  const isPdfScanned = useCallback(
    (pdfPath: string): boolean => {
      const matchingFile = files.find((f) => f.file_path === pdfPath);
      if (!matchingFile) return false;
      return hasConversion(matchingFile.id);
    },
    [files, hasConversion],
  );

  return { isPdfScanned };
}
