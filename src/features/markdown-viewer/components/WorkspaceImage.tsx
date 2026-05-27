import { useState, useEffect } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';

interface WorkspaceImageProps {
  src?: string;
  alt?: string;
  basePath?: string;
}

export function WorkspaceImage({ src, alt, basePath }: WorkspaceImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src || !basePath || src.startsWith('http') || src.startsWith('data:')) {
      setBlobUrl(null);
      return;
    }

    let revoked = false;
    const loadImage = async () => {
      try {
        const resolvedPath = src.startsWith('./')
          ? `${basePath}/${src.slice(2)}`
          : `${basePath}/${src}`;

        const bytes = await readFile(resolvedPath);
        const ext = src.split('.').pop()?.toLowerCase() ?? 'png';
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
        };
        const blob = new Blob([bytes], { type: mimeMap[ext] ?? 'image/png' });
        const url = URL.createObjectURL(blob);
        if (!revoked) setBlobUrl(url);
      } catch (err) {
        console.error('Failed to load image:', src, err);
      }
    };

    void loadImage();
    return () => {
      revoked = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src, basePath]);

  const imgSrc = blobUrl ?? src ?? '';

  return (
    <img
      src={imgSrc}
      alt={alt ?? 'Image'}
      className="max-w-full h-auto rounded-md my-4 border border-border shadow-sm"
      loading="lazy"
    />
  );
}
