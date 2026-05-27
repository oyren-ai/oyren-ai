import { SidebarHeader } from "@/components/ui/sidebar";
import Logo from "@/components/icons/Logo";

interface SidebarBrandHeaderProps {
  onLogoClick: () => void;
}

export function SidebarBrandHeader({ onLogoClick }: SidebarBrandHeaderProps) {
  return (
    <SidebarHeader data-testid="workspaces-sidebar-header">
      <h2 className="sr-only">Workspace Files</h2>
      <div className="flex items-center border-b py-2 justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
          <Logo className="text-neutral-600 dark:text-neutral-400" size={24} />
          <h1 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">OyrenAI</h1>
        </div>
      </div>
    </SidebarHeader>
  );
}
