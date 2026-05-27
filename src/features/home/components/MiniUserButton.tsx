import * as React from "react";
import { User, UserCheck } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { ProfileDialog } from "@/components/common/ProfileDialog";

export function MiniUserButton() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg text-muted-foreground"
        disabled={isLoading}
        onClick={() => login()}
      >
        <User className="h-4 w-4" />
      </Button>
    );
  }

  return <AuthenticatedMiniUser />;
}

function AuthenticatedMiniUser() {
  const { user, logout } = useAuth();
  const { balance, isLoading: creditsLoading, refetch } = useCredits();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-green-500">
          <UserCheck className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <ProfileDialog
        user={user}
        balance={balance}
        isLoading={creditsLoading}
        onRefetch={refetch}
        onLogout={handleLogout}
      />
    </Dialog>
  );
}
