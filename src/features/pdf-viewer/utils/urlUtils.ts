
export function isExternalUrl(url: string): boolean {
  try {
    if (!url || url.trim() === '') return false;
    
    if (url.startsWith('#')) return false;
    
    if (url.startsWith('./') || url.startsWith('../')) return false;
    
    if (url.startsWith('/') && !url.startsWith('//')) return false;
    
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.startsWith('file://') || 
        lowerUrl.startsWith('blob:') || 
        lowerUrl.startsWith('data:') ||
        lowerUrl.startsWith('javascript:') ||
        lowerUrl.startsWith('mailto:')) {
      return false;
    }
    
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return false;
    }
    
    if (!hostname || hostname === '') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

