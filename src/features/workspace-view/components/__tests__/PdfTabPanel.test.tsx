import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PdfTabPanel from '../PdfTabPanel';

vi.mock('@/features/pdf-viewer/components/OyrenPdfViewer', () => ({
  default: ({ pdfFilePath }: { pdfFilePath: string }) => (
    <div data-testid="oyren-pdf-viewer">Viewing: {pdfFilePath}</div>
  ),
}));

const defaultProps = {
  pdfPath: '/test.pdf',
  isActive: true,
  cachedUrl: 'blob:test',
  isDarkMode: false,
  initialZoom: 1,
  onZoomChange: vi.fn(),
  isScanned: false,
};

describe('PdfTabPanel', () => {
  it('renders green ring classes when isScanned is true', () => {
    const { container } = render(
      <PdfTabPanel {...defaultProps} isScanned={true} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('ring-2');
    expect(wrapper.className).toContain('ring-green-400');
    expect(wrapper.className).toContain('ring-inset');
    expect(wrapper.className).toContain('rounded-sm');
  });

  it('renders without ring classes when isScanned is false', () => {
    const { container } = render(
      <PdfTabPanel {...defaultProps} isScanned={false} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain('ring-2');
    expect(wrapper.className).not.toContain('ring-green-400');
  });

  it('is hidden via display none when isActive is false', () => {
    const { container } = render(
      <PdfTabPanel {...defaultProps} isActive={false} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.display).toBe('none');
  });

  it('is visible when isActive is true', () => {
    const { container } = render(
      <PdfTabPanel {...defaultProps} isActive={true} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.display).toBe('block');
  });

  it('renders OyrenPdfViewer with correct props', () => {
    render(<PdfTabPanel {...defaultProps} />);
    expect(screen.getByTestId('oyren-pdf-viewer')).toBeInTheDocument();
    expect(screen.getByText('Viewing: /test.pdf')).toBeInTheDocument();
  });
});
