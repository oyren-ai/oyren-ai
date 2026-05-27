import { Card } from "@/components/ui/card";
import type { AiProviderKey } from "@/types/aiProviderKey";
import { ApiKeyCardMenu } from "./ApiKeyCardMenu";

interface ApiKeyCardProps {
  apiKey: AiProviderKey;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
}

function obfuscateApiKey(key: string): string {
  if (key.length <= 4) return key;
  return `••••••••••••${key.slice(-4)}`;
}

export function ApiKeyCard({ apiKey, onClick, onEdit, onDelete, isSelected = false }: ApiKeyCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`p-4 w-full min-w-0 hover:shadow-lg hover:bg-accent/5 dark:hover:bg-accent/10 dark:hover:shadow-2xl transition-all duration-200 cursor-pointer ${
        isSelected ? "border-primary border-2 bg-accent/10" : ""
      }`}
      data-testid={`api-key-card-${apiKey.id}`}
    >
      <div className="flex items-start justify-between gap-3 w-full overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-base mb-2 truncate">{apiKey.name}</h3>
          <p className="text-sm font-mono mb-3 text-muted-foreground">
            {obfuscateApiKey(apiKey.key)}
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground overflow-hidden">
            <span className="truncate">Provider: {apiKey.ai_provider.name}</span>
            <span className="whitespace-nowrap truncate">
              Added: {new Date(apiKey.date_added).toLocaleDateString()}
            </span>
          </div>
        </div>

        <ApiKeyCardMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </Card>
  );
}
