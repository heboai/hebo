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

export const guestUser: User = {
  name: "Guest User",
  email: "guest@example.com",
  initials: "GU",
  avatar: "about:blank",
};
