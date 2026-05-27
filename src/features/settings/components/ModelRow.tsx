import {Switch} from "@/components/ui/switch";
import {Loader2, CheckCircle2, XCircle} from "lucide-react";
import type {AiModel} from "@/types/aiProviderKey";

interface ModelRowProps {
    model: AiModel;
    testState?: 'testing' | 'success' | 'error';
    onToggle: (modelId: string, newState: boolean) => void;
}

function StatusText({enabled, testState}: {enabled: boolean; testState?: string}) {
    if (testState === 'testing') {
        return (
            <span className="flex items-center gap-1 text-blue-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Testing connection... This will cost very few tokens
            </span>
        );
    }
    if (testState === 'success') {
        return (
            <span className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="w-3 h-3" />
                Connection successful
            </span>
        );
    }
    if (testState === 'error') {
        return (
            <span className="flex items-center gap-1 text-red-500">
                <XCircle className="w-3 h-3" />
                Connection failed
            </span>
        );
    }
    return <span>{enabled ? "Enabled" : "Disabled"}</span>;
}

export function ModelRow({model, testState, onToggle}: ModelRowProps) {
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
                <p className="font-medium">{model.name}</p>
                <p className="text-sm text-muted-foreground">
                    <StatusText enabled={model.enabled} testState={testState} />
                </p>
            </div>
            <Switch
                checked={model.enabled}
                disabled={testState === 'testing'}
                onCheckedChange={(checked) => onToggle(model.id, checked)}
            />
        </div>
    );
}
