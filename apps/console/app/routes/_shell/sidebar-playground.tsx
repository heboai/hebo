import { Chat } from "@hebo/aikit-ui/blocks/Chat";
import { fetchConfig } from "~console/lib/fetch-config";

type Branch = {
  models?: Array<{
    alias: string;
    type: string;
  }>;
};

export function PlaygroundSidebar({ activeBranch }: { activeBranch?: Branch }) {
  const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL?.trim();
  
  if (!gatewayBaseUrl) {
    console.error(
      "VITE_GATEWAY_URL environment variable is not set. Please configure it in your environment."
    );
  }

  const modelsConfig = {
    models: (activeBranch?.models ?? []).map((model) => ({
      ...model,
      endpoint: {
        baseUrl: `${gatewayBaseUrl}/v1`,
      },
    })),
  };

  return <Chat modelsConfig={modelsConfig} fetchConfig={fetchConfig} />;
}