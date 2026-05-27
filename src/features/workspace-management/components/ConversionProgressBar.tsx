interface ConversionProgressBarProps {
  progress: number;
}

export function ConversionProgressBar({ progress }: ConversionProgressBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-700/80">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
