export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export interface DetectModelsResponse {
  models: OllamaModel[];
}