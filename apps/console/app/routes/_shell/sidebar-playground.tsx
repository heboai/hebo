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
<<<<<<< HEAD
    endpoint: {
      baseUrl: new URL("v1", gatewayUrl).toString(),
      fetch: kyFetch,
    },
=======
    ...(VITE_GATEWAY_URL && {
      endpoint: {
        baseUrl: new URL("v1", VITE_GATEWAY_URL).toString(),
        fetch: kyFetch,
      },
    }),
>>>>>>> 6da31a37 (fix(console): Don't throw on empty VITE_GATEWAY_URL in dev mode)
  }));

  return <Chat modelsConfig={modelsConfig} />;
}
