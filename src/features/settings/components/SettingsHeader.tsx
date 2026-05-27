import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SettingsHeaderProps {
  onBackClick: () => void;
}

export function SettingsHeader({ onBackClick }: SettingsHeaderProps) {
  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </div>
    </div>
  );
}