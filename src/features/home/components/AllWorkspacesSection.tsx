import { WorkspaceCard } from "@/features/home/components/WorkspaceCard";
import { FolderOpen } from "lucide-react";
import type { WorkspaceDisplay } from "@/types/workspace";

interface AllWorkspacesSectionProps {
  workspaces: WorkspaceDisplay[];
}

export default function AllWorkspacesSection({
  workspaces
}: AllWorkspacesSectionProps): React.ReactNode {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">All Workspaces</h2>
      </div>
      
      {workspaces.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No workspaces yet.</p>
          <p className="text-sm">Create your first workspace to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
            />
          ))}
        </div>
      )}
    </div>
  );
}

