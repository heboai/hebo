import { Chat } from "@hebo/aikit-ui/blocks/Chat";

type Branch = {
  models?: Array<{
    alias: string;
    type: string;
  }>;
};

export function PlaygroundSidebar({ activeBranch }: { activeBranch?: Branch }) {
  const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL?.toString().trim();
  
  if (!gatewayBaseUrl) {
    console.error(
      "VITE_GATEWAY_URL environment variable is not set. Please configure it in your environment."
    );
  }

  const modelsConfig = {
    models: (activeBranch?.models ?? []).map((model) => ({
      ...model,
      endpoint: {
        baseUrl: gatewayBaseUrl,
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, {
            ...init,
            credentials: "include",
          }),
      },
    })),
  };

  return <Chat modelsConfig={modelsConfig} />;
}