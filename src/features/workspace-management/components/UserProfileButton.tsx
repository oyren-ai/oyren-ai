import * as React from "react";
import { UserCheck, Coins } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { ProfileDialog } from "@/components/common/ProfileDialog";

export function UserProfileButton() {
  const { user, logout } = useAuth();
  const { balance, isLoading, refetch } = useCredits();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-2 rounded-md bg-muted/50 hover:bg-muted transition-all hover:shadow-sm group w-full text-left">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
            <UserCheck className="h-4 w-4 text-green-500 transition-colors" />
          </div>
          <div className="grid flex-1 min-w-0 leading-tight">
            <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {user?.name || user?.email}
            </span>
            {balance && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
                {balance.credits} credits
              </span>
            )}
          </div>
        </button>
      </DialogTrigger>

      <ProfileDialog
        user={user}
        balance={balance}
        isLoading={isLoading}
        onRefetch={refetch}
        onLogout={handleLogout}
      />
    </Dialog>
  );
}
