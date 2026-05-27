import { describe, it, expect } from 'vitest';
import { extractFilenameFromUrl } from '../extractFilenameFromUrl';

describe('extractFilenameFromUrl', () => {
  it('extracts filename from simple PDF URL', () => {
    expect(extractFilenameFromUrl('https://example.com/paper.pdf')).toBe('paper.pdf');
  });

  it('extracts filename from nested path', () => {
    expect(extractFilenameFromUrl('https://arxiv.org/pdf/2301.00001.pdf')).toBe('2301.00001.pdf');
  });

  it('strips query parameters', () => {
    expect(extractFilenameFromUrl('https://example.com/file.pdf?token=abc')).toBe('file.pdf');
  });

  it('strips hash fragments', () => {
    expect(extractFilenameFromUrl('https://example.com/doc.pdf#page=2')).toBe('doc.pdf');
  });

  it('returns fallback for URL with no filename', () => {
    expect(extractFilenameFromUrl('https://example.com/')).toBe('downloaded.pdf');
  });

  it('returns fallback for URL ending with path only', () => {
    expect(extractFilenameFromUrl('https://example.com/download')).toBe('download.pdf');
  });

  it('appends .pdf if extension is missing', () => {
    expect(extractFilenameFromUrl('https://arxiv.org/pdf/2301.00001v2')).toBe('2301.00001v2.pdf');
  });

  it('preserves .pdf extension without duplicating', () => {
    expect(extractFilenameFromUrl('https://example.com/thesis.pdf')).toBe('thesis.pdf');
  });

  it('decodes URI-encoded characters', () => {
    expect(extractFilenameFromUrl('https://example.com/my%20paper.pdf')).toBe('my paper.pdf');
  });
});
