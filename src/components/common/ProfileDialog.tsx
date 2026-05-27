import { UserCheck, LogOut, Mail, Coins, RefreshCw } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { browserApi } from "@/api/browserApi";

interface ProfileDialogProps {
  user: { name: string; email: string } | null;
  balance: { credits: number } | null;
  isLoading: boolean;
  onRefetch: () => void;
  onLogout: () => void;
}

export function ProfileDialog({ user, balance, isLoading, onRefetch, onLogout }: ProfileDialogProps) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Profile</DialogTitle>
        <DialogDescription>Your account information</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <UserCheck className="h-6 w-6 text-green-500" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">
            {isLoading ? '...' : (balance?.credits ?? '--')} credits
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefetch} disabled={isLoading}>
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/40"
        onClick={() => browserApi.openUrl("https://oyren.ai/pricing")}
      >
        <Coins className="h-4 w-4" />
        Buy Credits
      </Button>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
        <Button variant="destructive" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </DialogContent>
  );
}