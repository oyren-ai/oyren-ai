import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceCard } from "@/features/home/components/WorkspaceCard";
import { Clock } from "lucide-react";
import type { WorkspaceDisplay } from "@/types/workspace";

interface RecentsSectionProps {
  workspaces: WorkspaceDisplay[];
}

export default function RecentsSection({ workspaces }: RecentsSectionProps): React.ReactNode {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recents</h2>
      </div>
      
      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent workspaces.</p>
              <p className="text-sm">Create a new workspace to get started.</p>
            </div>
          </CardContent>
        </Card>
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

