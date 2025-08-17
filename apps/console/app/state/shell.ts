import { proxy } from "valtio";

export const shellStore = proxy<{
  activeAgent: { slug: string; name: string } | undefined;
}>({
  activeAgent: undefined,
});
