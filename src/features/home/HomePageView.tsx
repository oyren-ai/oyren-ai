import { useMemo, useCallback, useEffect } from "react";
import { LeftMiniBar, TopBar, RecentsSection, AllWorkspacesSection } from "./components";
import type { Workspace, WorkspaceDisplay } from "@/types/workspace";
import { useWorkspaces } from "@/features/workspace-management/hooks/useWorkspaces";
import { formatRelativeTime } from "@/utils/time-utils";


// Presenter Component - Pure UI, no business logic
interface HomePagePresenterProps {
  workspaces: WorkspaceDisplay[];
  recentWorkspaces: WorkspaceDisplay[];
  loading: boolean;
}

function HomePagePresenter({
  workspaces,
  recentWorkspaces,
  loading
}: HomePagePresenterProps) {
  return (
    <div className="flex h-screen bg-background" data-testid="home-page">
      <LeftMiniBar />

      <div className="flex-1 flex flex-col">
        <TopBar />

        <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
          <div className="max-w-none mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Workspaces</h1>

            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading workspaces...</div>
              </div>
            )}

            {!loading && (
              <>
                <RecentsSection
                  workspaces={recentWorkspaces}
                  
                />
                <AllWorkspacesSection
                  workspaces={workspaces}
                  
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Container Component - Business logic and data fetching
function HomePageContainer() {
  const { workspaces, isLoadingWorkspaces, loadWorkspaces } = useWorkspaces();
  useEffect(() => {
    const handleWorkspaceUpdated = () => {
      loadWorkspaces();
    };

    window.addEventListener('workspace-updated', handleWorkspaceUpdated);
    return () => window.removeEventListener('workspace-updated', handleWorkspaceUpdated);
  }, [loadWorkspaces]);

  const recentWorkspaces = useMemo(
    () =>
      workspaces
        .slice(0, 3)
        .map((w) => ({
          ...w,
          lastAccessed: formatRelativeTime(w.last_accessed_at),
        })),
    [workspaces]
  );

  const formattedWorkspaces = useMemo(
    () =>
      workspaces.map((w) => ({
        ...w,
        lastAccessed: formatRelativeTime(w.last_accessed_at),
      })),
    [workspaces]
  );

  return (
    <HomePagePresenter
      workspaces={formattedWorkspaces}
      recentWorkspaces={recentWorkspaces}
      loading={isLoadingWorkspaces}
     
    />
  );
}

// Export container as HomePageView to maintain compatibility
export function HomePageView() {
  return <HomePageContainer />;
}
