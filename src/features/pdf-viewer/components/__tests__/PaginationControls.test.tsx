import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PaginationControls from '../PaginationControls';

describe('PaginationControls', () => {
  it('renders current page and total pages', () => {
    const mockPageNavigationPlugin = {
      GoToPreviousPage: ({ children }: any) => children({ onClick: vi.fn(), isDisabled: false }),
      GoToNextPage: ({ children }: any) => children({ onClick: vi.fn(), isDisabled: false }),
      CurrentPageInput: () => <input readOnly value="2" aria-label="Page" />,
      NumberOfPages: () => <span>20</span>,
      jumpToPage: vi.fn(),
    };

    render(<PaginationControls pageNavigationPlugin={mockPageNavigationPlugin as any} />);

    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('invokes callbacks when prev/next are clicked', () => {
    const prevClick = vi.fn();
    const nextClick = vi.fn();

    const mockPageNavigationPlugin = {
      GoToPreviousPage: ({ children }: any) => children({ onClick: prevClick, isDisabled: false }),
      GoToNextPage: ({ children }: any) => children({ onClick: nextClick, isDisabled: false }),
      CurrentPageInput: () => <input readOnly value="1" aria-label="Page" />,
      NumberOfPages: () => <span>5</span>,
      jumpToPage: vi.fn(),
    };

    render(<PaginationControls pageNavigationPlugin={mockPageNavigationPlugin as any} />);

    fireEvent.click(screen.getByTitle('Previous page'));
    fireEvent.click(screen.getByTitle('Next page'));

    expect(prevClick).toHaveBeenCalled();
    expect(nextClick).toHaveBeenCalled();
  });
});


