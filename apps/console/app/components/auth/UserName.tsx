import { useSnapshot } from "valtio";

import { authStore } from "~/state/auth";

export function UserName() {
  const auth = useSnapshot(authStore);

  return <span>{auth.user ? auth.user.name : "Loading..."}</span>;
}
