export interface AiModel {
    id: string;
    name: string;
    provider: string;
    enabled: boolean;
}

export interface AiProvider {
    id: string;
    name: string;
    created_at: string;
}

export interface AiProviderKey {
    id: string;
    ai_provider: AiProvider;
    name: string;
    key: string;
    date_added: string;
    last_used_date: string | null;
    is_local?: boolean;
    models: AiModel[];
}