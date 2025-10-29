import { Chat } from "@hebo/aikit-ui/blocks/Chat";
import { gatewayUrl, kyFetch } from "~console/lib/service";

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
      baseUrl: new URL("v1", gatewayUrl).toString(),
      fetch: kyFetch,
    },
  }));

  return <Chat modelsConfig={modelsConfig} />;
}
