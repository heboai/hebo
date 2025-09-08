export interface AuthService {
  ensureSignedIn(): void;
  generateApiKey(): Promise<string>;
  getAccessToken(): Promise<string | undefined>;
}

export type User = {
  email: string;
  name: string;
  initials?: string;
  avatar?: string;
};
