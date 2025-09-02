import { useSnapshot } from "valtio";

import { authStore } from "~console/state/auth";

export function UserName() {
  const { user } = useSnapshot(authStore);

  return <span>{user?.name}</span>;
}
