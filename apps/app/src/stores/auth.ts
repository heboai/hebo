import { proxy } from "valtio";

export interface User {
  email?: string;
  name?: string;
  initials?: string;
}

export const authState = proxy<{
  user: User;
}>({
  user: {
    email: "not@authenticated",
    name: "Not Authenticated",

    get initials() {
      return this.name
        .split(" ")
        .map((word) => word[0]?.toUpperCase())
        .join("");
    },
  },
});
