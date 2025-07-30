export interface AuthService {
  ensureSignedIn(redirect?: boolean): Promise<void>;
  generateApiKey() : Promise<string>;
}

export interface User {
  email: string;
  name: string;
  initials?: string;
  avatar?: string;
}

export const guestUser: User = {
  name: "Guest",
  email: "guest@example.com",
  get initials() {
    if (!this.name) return "";
    return this.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0]!.toUpperCase())
      .join("");
  },
  avatar: "about:blank",
};
