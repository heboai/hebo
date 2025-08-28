import { Chat } from "@hebo/aikit-ui/blocks/Chat";

type Branch = {
  models?: Array<{
    alias: string;
    type: string;
  }>;
};

export function PlaygroundSidebar({ activeBranch }: { activeBranch?: Branch }) {
  const gatewayBaseUrl = String(import.meta.env.VITE_GATEWAY_URL ?? "");
  const gatewayApiKey = String(import.meta.env.VITE_GATEWAY_API_KEY ?? "");

  const modelsConfig = {
    models: (activeBranch?.models ?? []).map((model) => ({
      ...model,
      endpoint: {
        baseUrl: gatewayBaseUrl,
        apiKey: gatewayApiKey || "",
      },
    })),
  };

  return <Chat modelsConfig={modelsConfig} />;
}