export interface AuthService {
  ensureSignedIn(): Promise<void>;
  generateApiKey(): Promise<string>;
  getAccessToken(): Promise<string | undefined>;
}

export type User = {
  email: string;
  name: string;
  initials?: string;
  avatar?: string;
};
