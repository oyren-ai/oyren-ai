import { Moon, Sun } from 'lucide-react';

interface PdfDarkModeToggleProps {
  isDarkMode: boolean;
  darkBackground: boolean;
  onToggleDarkBackground: () => void;
}

/**
 * PDF canvas dark/light — web toolbar style (bordered icon button).
 */
export default function PdfDarkModeToggle({
  isDarkMode,
  darkBackground,
  onToggleDarkBackground,
}: PdfDarkModeToggleProps) {
  if (!isDarkMode) return null;

  return (
    <button
      type="button"
      onClick={onToggleDarkBackground}
      title={darkBackground ? 'Switch to light PDF pages' : 'Dark PDF mode'}
      aria-label="Toggle PDF dark mode"
      aria-pressed={darkBackground}
      className="inline-flex items-center rounded-md border border-neutral-200 px-2 py-1 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {darkBackground ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    </button>
  );
}
