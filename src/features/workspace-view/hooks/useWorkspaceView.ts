import { useCallback } from 'react';

export function useWorkspaceView(
  isSidebarCollapsed: boolean,
  setIsSidebarCollapsed: (collapsed: boolean) => void
) {
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed, setIsSidebarCollapsed]);

  return {
    isSidebarCollapsed,
    handleToggleSidebar
  };
}