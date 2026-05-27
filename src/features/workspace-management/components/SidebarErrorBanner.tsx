interface SidebarErrorBannerProps {
  message: string | null;
}

export function SidebarErrorBanner({ message }: SidebarErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="mx-2 mb-2 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-md">
      {message}
    </div>
  );
}
