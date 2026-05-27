import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Plus } from "lucide-react";
import type { AiProviderKey } from "@/types/aiProviderKey";
import { ApiKeyCard } from "./ApiKeyCard";
import { OyrenCreditsCard } from "./OyrenCreditsCard";
import { useModelSettingsApiKeys } from "../hooks/useModelSettingsApiKeys";
import { useOptionalAuth } from "@/contexts/AuthContext";
import {
  OYREN_CREDITS_PROVIDER_ID,
  buildOyrenCreditsProvider,
} from "@/features/ai-chat/utils/oyrenCreditsProvider";
import { oyrenChatApi } from "@/api/oyrenChatApi";
import { useEffect, useState } from "react";

interface ModelSettingsApiKeysProps {
  onProviderSelect: (providerKey: AiProviderKey) => void;
  selectedProviderId: string | null;
}

export function ModelSettingsApiKeys({ onProviderSelect, selectedProviderId }: ModelSettingsApiKeysProps) {
  const auth = useOptionalAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [oyrenProvider, setOyrenProvider] = useState<AiProviderKey | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setOyrenProvider(null);
      return;
    }
    oyrenChatApi.getModels()
      .then((models) => setOyrenProvider(buildOyrenCreditsProvider(models)))
      .catch(() => setOyrenProvider(buildOyrenCreditsProvider([])));
  }, [isAuthenticated]);

  const {
    providerKeys, loading, selectedApiKeyId,
    handleCardClick, handleOyrenClick, handleEdit, handleDelete, handleAddKey,
  } = useModelSettingsApiKeys({ onProviderSelect, oyrenProvider });

  const isOyrenSelected =
    selectedApiKeyId === OYREN_CREDITS_PROVIDER_ID ||
    selectedProviderId === OYREN_CREDITS_PROVIDER_ID;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
          <Button size="sm" onClick={handleAddKey} data-testid="add-api-key-button">
            <Plus className="w-4 h-4 mr-1" />
            Add Key
          </Button>
        </div>
        <CardDescription>Configure your AI service provider API keys</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 max-h-[600px] overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
        ) : (
          <div className="grid gap-3 w-full overflow-hidden">
            {/* Oyren Credits — shown first when signed in */}
            {isAuthenticated && oyrenProvider && (
              <OyrenCreditsCard
                isSelected={isOyrenSelected}
                onClick={() => handleOyrenClick(oyrenProvider)}
              />
            )}

            {/* Local API keys */}
            {providerKeys.map((apiKey) => (
              <ApiKeyCard
                key={apiKey.id}
                apiKey={apiKey}
                onClick={() => handleCardClick(apiKey)}
                onEdit={() => handleEdit(apiKey)}
                onDelete={() => handleDelete(apiKey)}
                isSelected={selectedApiKeyId === apiKey.id && !isOyrenSelected}
              />
            ))}

            {!isAuthenticated && providerKeys.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No API keys yet. Click &quot;Add Key&quot; to create one.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
