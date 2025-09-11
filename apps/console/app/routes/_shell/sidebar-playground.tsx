import { Chat } from "@hebo/aikit-ui/blocks/Chat";
import { fetchConfig } from "~console/lib/fetch-config";

const VITE_GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL?.trim();

if (!VITE_GATEWAY_URL) {
  console.error(
    "VITE_GATEWAY_URL environment variable is not set. Please configure it in your environment."
  );
}

type Branch = {
  models?: Array<{
    alias: string;
    type: string;
  }>;
};

export function PlaygroundSidebar({ activeBranch }: { activeBranch?: Branch }) {
  const modelsConfig = {
    models: (activeBranch?.models ?? []).map((model) => ({
      ...model,
      endpoint: {
        baseUrl: new URL("v1", VITE_GATEWAY_URL).toString(),
      },
    })),
  };

  return <Chat modelsConfig={modelsConfig} fetchConfig={fetchConfig} />;
}
