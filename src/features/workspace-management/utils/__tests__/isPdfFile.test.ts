import { describe, it, expect } from 'vitest';
import isPdfFile from '../isPdfFile';

describe('isPdfFile', () => {
  it('should return true for lowercase .pdf extension', () => {
    expect(isPdfFile('document.pdf')).toBe(true);
  });

  it('should return true for uppercase .PDF extension', () => {
    expect(isPdfFile('DOCUMENT.PDF')).toBe(true);
  });

  it('should return true for mixed case .Pdf extension', () => {
    expect(isPdfFile('presentation.Pdf')).toBe(true);
  });

  it('should return true for filenames with multiple dots ending in .pdf', () => {
    expect(isPdfFile('my.complex.file.name.pdf')).toBe(true);
  });

  it('should return false for other extensions', () => {
    expect(isPdfFile('image.png')).toBe(false);
    expect(isPdfFile('notes.txt')).toBe(false);
    expect(isPdfFile('script.js')).toBe(false);
  });

  it('should return false for files without extension', () => {
    expect(isPdfFile('readme')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isPdfFile('')).toBe(false);
  });

  it('should return false if .pdf is not at the end', () => {
    expect(isPdfFile('document.pdf.bak')).toBe(false);
  });
});

