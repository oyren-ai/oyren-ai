import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useViewNavigation } from "@/contexts/NavigationContext";
import { Settings, HelpCircle, User } from "lucide-react";
import { ModeToggle } from "@/components/common/ModeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfileButton } from "./UserProfileButton";

export function SidebarFooterMenu() {
  const { navigateToSettings } = useViewNavigation();
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();

  return (
    <SidebarFooter>
      <SidebarMenu>
        {isAuthenticated ? (
          <SidebarMenuItem>
            <UserProfileButton />
          </SidebarMenuItem>
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={login} disabled={authLoading}>
              <User className="w-4 h-4" />
              <span>{authLoading ? 'Loading...' : 'Log in'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <ModeToggle variant="sidebar" />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => navigateToSettings()}>
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}