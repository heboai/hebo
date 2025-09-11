import { Chat } from "@hebo/aikit-ui/blocks/Chat";

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
        baseUrl: VITE_GATEWAY_URL,
      },
    })),
  };

  return <Chat modelsConfig={modelsConfig} />;
}
