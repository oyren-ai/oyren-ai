import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { creditApi } from "@/api/creditApi";
import { OYREN_CREDITS_PROVIDER_ID } from "@/features/ai-chat/utils/oyrenCreditsProvider";

interface OyrenCreditsCardProps {
  isSelected?: boolean;
  onClick: () => void;
}

export function OyrenCreditsCard({ isSelected = false, onClick }: OyrenCreditsCardProps) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    creditApi.getBalance()
      .then((data) => setBalance(data.credits))
      .catch(() => setBalance(null));
  }, []);

  return (
    <Card
      onClick={onClick}
      className={`p-4 w-full cursor-pointer hover:shadow-lg hover:bg-accent/5 dark:hover:bg-accent/10 transition-all duration-200 ${
        isSelected ? "border-primary border-2 bg-accent/10" : ""
      }`}
      data-testid={`api-key-card-${OYREN_CREDITS_PROVIDER_ID}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-base">Oyren Credits</h3>
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Zap className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Use your credit balance — no API key required
          </p>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Coins className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {balance !== null ? `${balance.toLocaleString()} credits available` : 'Loading balance...'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
