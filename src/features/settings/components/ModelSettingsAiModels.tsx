import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Cpu} from "lucide-react";
import {ModelRow} from "./ModelRow";
import type {AiModel} from "@/types/aiProviderKey";
import type {TestingState} from "../hooks/useModelToggle";

interface ModelSettingsAiModelsProps {
    onModelToggle: (modelId: string, newState: boolean) => void;
    selectedProviderName: string | null;
    models: AiModel[];
    testingModels: TestingState;
}

export function ModelSettingsAiModels({onModelToggle, selectedProviderName, models, testingModels}: ModelSettingsAiModelsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5"/>
                    AI Models
                </CardTitle>
                <CardDescription>
                    {selectedProviderName
                        ? `AI models for ${selectedProviderName}`
                        : "Select an API key to view available models"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {models.map((model) => (
                        <ModelRow
                            key={model.id}
                            model={model}
                            testState={testingModels[model.id]}
                            onToggle={onModelToggle}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
