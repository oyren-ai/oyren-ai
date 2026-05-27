import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateWorkspaceModal } from "@/contexts/ModalContext";

export default function TopBar(): React.ReactNode {
  const createWorkspaceModal = useCreateWorkspaceModal();

  return (
    <div className="border-b bg-background">
      <div className="flex items-center h-12 px-4">
        <h1 className="text-xl font-semibold text-foreground">Home</h1>

        <div className="flex-1"></div>

        <Button onClick={createWorkspaceModal.open} size="sm" data-testid="create-workspace-btn">
          <Plus className="w-4 h-4 mr-2" />
          New Workspace
        </Button>
      </div>
    </div>
  );
}

