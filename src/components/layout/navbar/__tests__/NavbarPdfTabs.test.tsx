import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavbarPdfTabs from '../NavbarPdfTabs';

interface OpenPdf {
  id: string;
  path: string;
  name: string;
}

describe('NavbarPdfTabs', () => {
  const mockOnSelectPdf = vi.fn();
  const mockOnClosePdf = vi.fn();

  const initialPdfs: OpenPdf[] = [
    { id: '1', name: 'File A', path: '/a.pdf' },
    { id: '2', name: 'File B', path: '/b.pdf' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tabs for all PDFs', () => {
    render(
      <NavbarPdfTabs
        pdfs={initialPdfs}
        activePdfPath="/a.pdf"
        onSelectPdf={mockOnSelectPdf}
        onClosePdf={mockOnClosePdf}
      />
    );

    // Assert both tabs exist
    expect(screen.getByTestId('tab-1')).toBeInTheDocument();
    expect(screen.getByTestId('tab-2')).toBeInTheDocument();
    
    // Assert both tab names are visible
    expect(screen.getByText('File A')).toBeInTheDocument();
    expect(screen.getByText('File B')).toBeInTheDocument();
    
    // Assert close buttons exist
    expect(screen.getByTestId('tab-close-1')).toBeInTheDocument();
    expect(screen.getByTestId('tab-close-2')).toBeInTheDocument();
  });

  it('does not render when pdfs array is empty', () => {
    const { container } = render(
      <NavbarPdfTabs
        pdfs={[]}
        activePdfPath={null}
        onSelectPdf={mockOnSelectPdf}
        onClosePdf={mockOnClosePdf}
      />
    );

    // Component returns null when pdfs is empty
    expect(container.firstChild).toBeNull();
  });

  it('renders with default empty array when pdfs prop is undefined', () => {
    const { container } = render(
      <NavbarPdfTabs
        activePdfPath={null}
        onSelectPdf={mockOnSelectPdf}
        onClosePdf={mockOnClosePdf}
      />
    );

    // Component should handle undefined pdfs gracefully
    expect(container.firstChild).toBeNull();
  });

  it('calls onSelectPdf when a tab is clicked', () => {
    render(
      <NavbarPdfTabs
        pdfs={initialPdfs}
        activePdfPath="/a.pdf"
        onSelectPdf={mockOnSelectPdf}
        onClosePdf={mockOnClosePdf}
      />
    );

    const tab1 = screen.getByTestId('tab-1');
    fireEvent.click(tab1);

    expect(mockOnSelectPdf).toHaveBeenCalledWith('/a.pdf');
  });

  it('calls onClosePdf when close button is clicked', () => {
    render(
      <NavbarPdfTabs
        pdfs={initialPdfs}
        activePdfPath="/a.pdf"
        onSelectPdf={mockOnSelectPdf}
        onClosePdf={mockOnClosePdf}
      />
    );

    const closeButton1 = screen.getByTestId('tab-close-1');
    fireEvent.click(closeButton1);

    expect(mockOnClosePdf).toHaveBeenCalledWith('/a.pdf');
    expect(mockOnClosePdf).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading prop is true', () => {
    render(
      <NavbarPdfTabs
        pdfs={initialPdfs}
        activePdfPath="/a.pdf"
        onSelectPdf={mockOnSelectPdf}
        onClosePdf={mockOnClosePdf}
        loading={true}
      />
    );

    // Both tabs should show "Loading..." text
    const loadingTexts = screen.getAllByText('Loading...');
    expect(loadingTexts).toHaveLength(2);
    
    // Original file names should not be visible when loading
    expect(screen.queryByText('File A')).not.toBeInTheDocument();
    expect(screen.queryByText('File B')).not.toBeInTheDocument();
  });

  describe('Re-rendering with updated props', () => {
    it('removes tab when file is removed from pdfs array', () => {
      const { rerender } = render(
        <NavbarPdfTabs
          pdfs={initialPdfs}
          activePdfPath="/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // First assert both tabs exist
      expect(screen.getByTestId('tab-1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-2')).toBeInTheDocument();
      expect(screen.getByText('File A')).toBeInTheDocument();
      expect(screen.getByText('File B')).toBeInTheDocument();

      // Simulate removing File A by rerendering with updated pdfs array
      const updatedPdfs: OpenPdf[] = [
        { id: '2', name: 'File B', path: '/b.pdf' },
      ];

      rerender(
        <NavbarPdfTabs
          pdfs={updatedPdfs}
          activePdfPath="/b.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // Assert removed file's tab no longer exists
      expect(screen.queryByTestId('tab-1')).not.toBeInTheDocument();
      expect(screen.queryByText('File A')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-close-1')).not.toBeInTheDocument();

      // Assert remaining file's tab still exists
      expect(screen.getByTestId('tab-2')).toBeInTheDocument();
      expect(screen.getByText('File B')).toBeInTheDocument();
      expect(screen.getByTestId('tab-close-2')).toBeInTheDocument();
    });

    it('updates tab name when file name is edited', () => {
      const { rerender } = render(
        <NavbarPdfTabs
          pdfs={initialPdfs}
          activePdfPath="/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // First assert original names are visible
      expect(screen.getByText('File A')).toBeInTheDocument();
      expect(screen.getByText('File B')).toBeInTheDocument();

      // Simulate editing File A's name by rerendering with updated pdfs array
      const updatedPdfs: OpenPdf[] = [
        { id: '1', name: 'File A - Edited', path: '/a.pdf' },
        { id: '2', name: 'File B', path: '/b.pdf' },
      ];

      rerender(
        <NavbarPdfTabs
          pdfs={updatedPdfs}
          activePdfPath="/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // Assert the UI displays the new name
      expect(screen.getByText('File A - Edited')).toBeInTheDocument();
      expect(screen.getByText('File B')).toBeInTheDocument();
      
      // Assert old name is no longer visible
      expect(screen.queryByText('File A')).not.toBeInTheDocument();

      // Assert tabs still exist with correct test IDs
      expect(screen.getByTestId('tab-1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-2')).toBeInTheDocument();
    });

    it('updates active tab when activePdfPath changes', () => {
      const { rerender } = render(
        <NavbarPdfTabs
          pdfs={initialPdfs}
          activePdfPath="/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // Change active PDF path
      rerender(
        <NavbarPdfTabs
          pdfs={initialPdfs}
          activePdfPath="/b.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // Both tabs should still exist
      expect(screen.getByTestId('tab-1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-2')).toBeInTheDocument();
    });

    it('handles multiple file updates (remove and edit) in single rerender', () => {
      const { rerender } = render(
        <NavbarPdfTabs
          pdfs={initialPdfs}
          activePdfPath="/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // Initial state: both files present
      expect(screen.getByText('File A')).toBeInTheDocument();
      expect(screen.getByText('File B')).toBeInTheDocument();

      // Simulate removing File A and editing File B's name
      const updatedPdfs: OpenPdf[] = [
        { id: '2', name: 'File B - Updated', path: '/b.pdf' },
      ];

      rerender(
        <NavbarPdfTabs
          pdfs={updatedPdfs}
          activePdfPath="/b.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // Assert File A is removed
      expect(screen.queryByText('File A')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-1')).not.toBeInTheDocument();

      // Assert File B has new name
      expect(screen.getByText('File B - Updated')).toBeInTheDocument();
      expect(screen.getByTestId('tab-2')).toBeInTheDocument();
      
      // Assert old File B name is gone
      expect(screen.queryByText('File B')).not.toBeInTheDocument();
    });

    it('updates path when file path is changed', () => {
      const { rerender } = render(
        <NavbarPdfTabs
          pdfs={initialPdfs}
          activePdfPath="/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // Simulate file path change (e.g., file was moved)
      const updatedPdfs: OpenPdf[] = [
        { id: '1', name: 'File A', path: '/new/path/a.pdf' },
        { id: '2', name: 'File B', path: '/b.pdf' },
      ];

      rerender(
        <NavbarPdfTabs
          pdfs={updatedPdfs}
          activePdfPath="/new/path/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      // File name should still be visible
      expect(screen.getByText('File A')).toBeInTheDocument();
      expect(screen.getByText('File B')).toBeInTheDocument();

      // Clicking the tab should call onSelectPdf with new path
      const tab1 = screen.getByTestId('tab-1');
      fireEvent.click(tab1);
      
      expect(mockOnSelectPdf).toHaveBeenCalledWith('/new/path/a.pdf');
    });
  });

  describe('Edge cases', () => {
    it('handles single file in array', () => {
      const singleFile: OpenPdf[] = [
        { id: '1', name: 'Single File', path: '/single.pdf' },
      ];

      render(
        <NavbarPdfTabs
          pdfs={singleFile}
          activePdfPath="/single.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      expect(screen.getByTestId('tab-1')).toBeInTheDocument();
      expect(screen.getByText('Single File')).toBeInTheDocument();
      expect(screen.queryByTestId('tab-2')).not.toBeInTheDocument();
    });

    it('handles removing all files', () => {
      const { rerender } = render(
        <NavbarPdfTabs
          pdfs={initialPdfs}
          activePdfPath="/a.pdf"
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      expect(screen.getByTestId('tab-1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-2')).toBeInTheDocument();

      // Remove all files
      rerender(
        <NavbarPdfTabs
          pdfs={[]}
          activePdfPath={null}
          onSelectPdf={mockOnSelectPdf}
          onClosePdf={mockOnClosePdf}
        />
      );

      expect(screen.queryByTestId('tab-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-2')).not.toBeInTheDocument();
      expect(screen.queryByText('File A')).not.toBeInTheDocument();
      expect(screen.queryByText('File B')).not.toBeInTheDocument();
    });
  });
});

