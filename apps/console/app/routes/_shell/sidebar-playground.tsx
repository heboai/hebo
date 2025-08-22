import { Chat } from "@hebo/aikit-ui/src/blocks/Chat";

type Branch = {
  models?: Array<{
    alias: string;
    type: string;
  }>;
};

interface PlaygroundSidebarProps {
  activeBranch?: Branch;
}

export function PlaygroundSidebar({ activeBranch }: PlaygroundSidebarProps) {
  if (!activeBranch?.models?.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Agent doesn't have a model yet</p>
      </div>
    );
  }

  const modelsConfig = {
    __supportedTypes: activeBranch.models.map((model) => model.type),
    models: [{
      alias: activeBranch.models[0].alias,
      type: activeBranch.models[0].type,
      endpoint: {
        baseUrl: import.meta.env.VITE_GATEWAY_URL!,
        apiKey: "",
        provider: "openai" as const
      }
    }]
  };

  return <Chat modelsConfig={modelsConfig} />;
}
