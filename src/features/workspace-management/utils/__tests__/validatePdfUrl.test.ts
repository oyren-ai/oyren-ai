import { describe, it, expect } from 'vitest';
import { validatePdfUrl } from '../validatePdfUrl';

describe('validatePdfUrl', () => {
  it('accepts valid HTTPS PDF URL', () => {
    expect(validatePdfUrl('https://arxiv.org/pdf/2301.00001.pdf')).toEqual({ valid: true });
  });

  it('accepts valid HTTP URL', () => {
    expect(validatePdfUrl('http://example.com/paper.pdf')).toEqual({ valid: true });
  });

  it('accepts URL without .pdf extension', () => {
    expect(validatePdfUrl('https://example.com/download')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    expect(validatePdfUrl('')).toEqual({ valid: false, error: 'Please enter a URL' });
  });

  it('rejects whitespace-only string', () => {
    expect(validatePdfUrl('   ')).toEqual({ valid: false, error: 'Please enter a URL' });
  });

  it('rejects non-URL string', () => {
    expect(validatePdfUrl('not-a-url')).toEqual({ valid: false, error: 'Please enter a valid URL' });
  });

  it('rejects FTP protocol', () => {
    expect(validatePdfUrl('ftp://example.com/file.pdf')).toEqual({
      valid: false, error: 'Only HTTP and HTTPS URLs are supported',
    });
  });

  it('trims whitespace before validating', () => {
    expect(validatePdfUrl('  https://example.com/paper.pdf  ')).toEqual({ valid: true });
  });
});
