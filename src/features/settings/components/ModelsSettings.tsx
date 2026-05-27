import {useState} from "react";
import {ModelSettingsApiKeys} from "./ModelSettingsApiKeys";
import {ModelSettingsAiModels} from "./ModelSettingsAiModels";
import {useModelToggle} from "../hooks/useModelToggle";
import type {AiProviderKey} from "@/types/aiProviderKey";

export function ModelsSettings() {
    const [selectedProviderKey, setSelectedProviderKey] = useState<AiProviderKey | null>(null);
    const {testingModels, handleToggle} = useModelToggle({selectedProviderKey, setSelectedProviderKey});

    const handleProviderSelect = (providerKey: AiProviderKey) => {
        setSelectedProviderKey(providerKey);
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2 w-full overflow-hidden" data-testid="models-settings">
            <div className="min-w-0">
                <ModelSettingsApiKeys
                    onProviderSelect={handleProviderSelect}
                    selectedProviderId={selectedProviderKey?.id || null}
                />
            </div>
            <div className="min-w-0">
                <ModelSettingsAiModels
                    onModelToggle={handleToggle}
                    selectedProviderName={selectedProviderKey?.ai_provider.name || null}
                    models={selectedProviderKey?.models || []}
                    testingModels={testingModels}
                />
            </div>
        </div>
    );
}
