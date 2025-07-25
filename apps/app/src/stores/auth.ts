import { proxy } from "valtio";

export interface User {
  email?: string;
  name?: string;
  initials?: string;
  avatar?: string;
}

export const authState = proxy<{
  user: User;
}>({
  user: {
    email: "not@authenticated",
    name: "Not Authenticated",
    get initials() {
      if (!this.name) return "";
      return this.name
        .trim()
        .split(/\s+/)
        .map((word) => word[0]!.toUpperCase())
        .join("");
    },
    avatar: "about:blank",
  },
});
