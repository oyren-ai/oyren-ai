import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageNavigationPlugin } from '@react-pdf-viewer/page-navigation';

const navBtnClass =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-neutral-700 transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-200 dark:hover:bg-neutral-800';

interface PaginationControlsProps {
  pageNavigationPlugin: PageNavigationPlugin;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ pageNavigationPlugin }) => {
  const { GoToPreviousPage, CurrentPageInput, NumberOfPages, GoToNextPage } = pageNavigationPlugin;

  return (
    <div className="oyren-pdf-toolbar-pagination flex h-8 shrink-0 items-center gap-0.5 rounded-md border border-neutral-200 bg-white/90 px-0.5 dark:border-white/15 dark:bg-neutral-950/90">
      <GoToPreviousPage>
        {(props: { onClick: () => void; isDisabled: boolean }) => (
          <button
            type="button"
            onClick={props.onClick}
            disabled={props.isDisabled}
            className={navBtnClass}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </GoToPreviousPage>

      <div className="flex items-center gap-1 px-0.5 text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
        <div className="flex h-[22px] min-w-[1.75rem] items-center justify-center rounded border border-neutral-200 px-1 dark:border-white/12 dark:bg-black/35">
          <CurrentPageInput />
        </div>
        <span aria-hidden>/</span>
        <span className="min-w-[1ch]">
          <NumberOfPages />
        </span>
      </div>

      <GoToNextPage>
        {(props: { onClick: () => void; isDisabled: boolean }) => (
          <button
            type="button"
            onClick={props.onClick}
            disabled={props.isDisabled}
            className={navBtnClass}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </GoToNextPage>
    </div>
  );
};

export default PaginationControls;
