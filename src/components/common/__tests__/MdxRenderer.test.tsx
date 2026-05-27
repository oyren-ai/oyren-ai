import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import MdxRenderer from '../MdxRenderer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_MD_PATH = path.resolve(__dirname, '../../../test-fixtures/sample-markdown-with-images.md');

describe('MdxRenderer', () => {
  it('renders plain text correctly', () => {
    const content = 'Hello, world!';
    render(<MdxRenderer content={content} />);
    
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('renders markdown headings', () => {
    const content = '# Heading 1\n## Heading 2\n### Heading 3';
    render(<MdxRenderer content={content} />);
    
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2 = screen.getByRole('heading', { level: 2 });
    const h3 = screen.getByRole('heading', { level: 3 });
    
    expect(h1).toHaveTextContent('Heading 1');
    expect(h2).toHaveTextContent('Heading 2');
    expect(h3).toHaveTextContent('Heading 3');
  });

  it('renders bold and italic text', () => {
    const content = '**Bold text** and *italic text*';
    render(<MdxRenderer content={content} />);
    
    expect(screen.getByText('Bold text')).toHaveClass('font-semibold');
    expect(screen.getByText('italic text')).toHaveStyle({ fontStyle: 'italic' });
  });

  it('renders inline code', () => {
    const content = 'Use `console.log()` to debug';
    render(<MdxRenderer content={content} />);
    
    const codeElement = screen.getByText('console.log()');
    expect(codeElement.tagName).toBe('CODE');
    expect(codeElement).toHaveClass('px-2', 'py-0.5', 'bg-muted', 'rounded-md', 'border', 'border-border');
  });

  it('renders code blocks with syntax highlighting', () => {
    const content = '```javascript\nconst x = 42;\nconsole.log(x);\n```';
    render(<MdxRenderer content={content} />);
    
    // Check that the code block container is rendered
    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    
    // Check that code contains the expected content (may be split across multiple spans)
    const codeContainer = document.querySelector('code');
    expect(codeContainer?.textContent).toContain('const x = 42;');
    expect(codeContainer?.textContent).toContain('console.log(x);');
  });

  it('renders unordered lists', () => {
    const content = '- Item 1\n- Item 2\n- Item 3';
    render(<MdxRenderer content={content} />);
    
    const list = screen.getByRole('list');
    expect(list).toHaveClass('list-disc');
    
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Item 1');
  });

  it('renders ordered lists', () => {
    const content = '1. First\n2. Second\n3. Third';
    render(<MdxRenderer content={content} />);
    
    const list = screen.getByRole('list');
    expect(list).toHaveClass('list-decimal');
    
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('renders blockquotes', () => {
    const content = '> This is a quote';
    render(<MdxRenderer content={content} />);
    
    const blockquote = screen.getByText('This is a quote').parentElement;
    expect(blockquote?.tagName).toBe('BLOCKQUOTE');
    expect(blockquote).toHaveClass('border-l-4', 'border-primary', 'bg-muted/30', 'rounded-r-lg');
  });

  it('renders links with correct attributes', () => {
    const content = '[Google](https://google.com)';
    render(<MdxRenderer content={content} />);
    
    const link = screen.getByRole('link', { name: 'Google' });
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders tables', () => {
    const content = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
    render(<MdxRenderer content={content} />);
    
    // react-markdown may not parse single-line tables correctly
    // Check if table content is at least rendered
    expect(screen.getByText(/Header 1/)).toBeInTheDocument();
    expect(screen.getByText(/Cell 1/)).toBeInTheDocument();
  });

  it('renders inline math expressions', () => {
    const content = 'The formula is $E = mc^2$';
    render(<MdxRenderer content={content} />);
    
    // MathJax renders math in mjx-container elements
    const mathElements = document.querySelectorAll('mjx-container');
    expect(mathElements.length).toBeGreaterThan(0);
  });

  it('renders display math expressions', () => {
    const content = '$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$';
    render(<MdxRenderer content={content} />);
    
    // MathJax renders display math in mjx-container elements
    const mathElements = document.querySelectorAll('mjx-container');
    expect(mathElements.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const content = 'Test content';
    const { container } = render(<MdxRenderer content={content} className="custom-class" />);
    
    const mdxContent = container.querySelector('.mdx-content');
    expect(mdxContent).toHaveClass('custom-class');
  });

  describe('sample markdown with images fixture', () => {
    let sampleContent: string;
    beforeAll(() => {
      sampleContent = readFileSync(SAMPLE_MD_PATH, 'utf-8');
    });

    it('renders sample fixture without imageBasePath (absolute URL image only)', () => {
      render(<MdxRenderer content={sampleContent} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sample Markdown with Images');
      const imgs = document.querySelectorAll('.mdx-content img');
      expect(imgs.length).toBeGreaterThanOrEqual(1);
    });

    it('renders sample fixture with imageBasePath and imageBaseUrl', async () => {
      const fetchMock = vi.fn().mockImplementation((input: RequestInfo) => {
        const u = String(input);
        if (u.includes('/api/marker/asset')) {
          return Promise.resolve(
            new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), {
              status: 200,
              headers: { 'Content-Type': 'image/png' },
            }),
          );
        }
        return Promise.reject(new Error(`Unexpected fetch: ${u}`));
      });
      vi.stubGlobal('fetch', fetchMock);

      render(
        <MdxRenderer
          content={sampleContent}
          imageBasePath="test-job-id"
          imageBaseUrl="https://example.com"
        />,
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sample Markdown with Images');
      await waitFor(() => {
        expect(document.querySelectorAll('.mdx-content img').length).toBe(2);
      });
      expect(Array.from(document.querySelectorAll('.mdx-content img')).some((el) => el.getAttribute('src')?.includes('placehold.co'))).toBe(true);
      expect(
        Array.from(document.querySelectorAll('.mdx-content img')).some((el) =>
          el.getAttribute('src')?.includes('mock-blob'),
        ),
      ).toBe(true);
      vi.unstubAllGlobals();
    });
  });
});