import { Chat } from "@hebo/aikit-ui/blocks/Chat";
import { kyFetch } from "~console/lib/service";

const VITE_GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL?.trim() || "http://localhost:3002";

type Branch = {
  agent_slug: string;
  models?: Array<{
    alias: string;
  }>;
  slug: string;
};

export function PlaygroundSidebar({ activeBranch }: { activeBranch?: Branch }) {
  const modelsConfig = (activeBranch?.models ?? []).map((model) => ({
    alias: `${activeBranch?.agent_slug}/${activeBranch?.slug}/${model.alias}`,
    endpoint: {
      baseUrl: new URL("v1", VITE_GATEWAY_URL).toString(),
      fetch: kyFetch,
    },
  }));

  return <Chat modelsConfig={modelsConfig} />;
}
