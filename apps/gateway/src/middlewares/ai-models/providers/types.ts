import type { Provider as AiProvider } from "ai";

export interface Provider {
  create(): Promise<AiProvider>;
  resolveModelId(id: string): Promise<string>;
}
