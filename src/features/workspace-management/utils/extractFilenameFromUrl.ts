const FALLBACK_FILENAME = 'downloaded.pdf';

export function extractFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop();
    if (!lastSegment) return FALLBACK_FILENAME;

    const decoded = decodeURIComponent(lastSegment);
    if (!decoded) return FALLBACK_FILENAME;

    return decoded.toLowerCase().endsWith('.pdf') ? decoded : `${decoded}.pdf`;
  } catch {
    return FALLBACK_FILENAME;
  }
}
