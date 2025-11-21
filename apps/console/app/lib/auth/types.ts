export interface AuthService {
  ensureSignedIn(): Promise<void>;
  getAccessToken(): string | undefined;
  generateApiKey(description: string, expiresIn?: number): Promise<ApiKey>;
  revokeApiKey(apiKeyId: string): Promise<void>;
  listApiKeys(): Promise<Array<ApiKey>>;
}

export const DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type User = {
  email: string;
  name: string;
  initials?: string;
  avatar?: string;
};

export type ApiKey = {
  id: string;
  description: string;
  value: string;
  createdAt: Date;
  expiresAt: Date;
};
