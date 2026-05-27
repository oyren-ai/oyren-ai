interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePdfUrl(url: string): ValidationResult {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: 'Please enter a URL' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
  }

  return { valid: true };
}
