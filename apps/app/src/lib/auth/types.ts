export interface AuthService {
  ensureSignedIn(): Promise<void>;
  generateApiKey(): Promise<string>;
}

export interface User {
  email: string;
  name: string;
  initials?: string;
  avatar?: string;
}
