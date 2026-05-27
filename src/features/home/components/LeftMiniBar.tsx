import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { useViewNavigation } from "@/contexts/NavigationContext";
import { Settings } from "lucide-react";
import { ModeToggle } from "@/components/common/ModeToggle";
import { MiniUserButton } from "./MiniUserButton";

export default function LeftMiniBar(): React.ReactNode {
  const { navigateToSettings } = useViewNavigation();

  return (
    <div className="w-12 border-r border-border flex flex-col items-center py-4">
      <div className="mb-6">
        <Logo className="text-primary" size={24} />
      </div>

      <div className="mt-auto flex flex-col items-center gap-2">
        <MiniUserButton />
        <ModeToggle variant="simple" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          onClick={() => navigateToSettings()}
          data-testid="settings-button"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

