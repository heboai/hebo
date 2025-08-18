export interface AuthService {
  ensureSignedIn(): void;
  generateApiKey(): Promise<string>;
}

export type User = {
  email: string;
  name: string;
  initials?: string;
  avatar?: string;
};
