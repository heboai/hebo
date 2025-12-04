import supportedModels from "@hebo/shared-data/json/supported-models";
import { Badge } from "@hebo/shared-ui/components/Badge";
import { Select } from "@hebo/shared-ui/components/Select";

import type { ComponentProps } from "react";

const SUPPORTED_MODELS = Object.fromEntries(
  supportedModels.map(({ type, displayName, providers }) => [
    type,
    { displayName, providers: Object.keys(providers[0]) },
  ]),
);

function ModelSelector({ ...props }: ComponentProps<typeof Select>) {
  return (
    <Select
      {...props}
      items={supportedModels.map((m) => ({
        value: m.type,
        name: (
          <>
            {m.displayName}{" "}
            {m.monthlyFreeTokens > 0 && (
              <Badge className="bg-green-600 text-white">Free Tier</Badge>
            )}
            {m.modality === "embedding" && (
              <Badge className="bg-blue-500 text-white">Embeddings</Badge>
            )}
          </>
        ),
      }))}
      placeholder="Select the model"
    />
  );
}

export { SUPPORTED_MODELS, ModelSelector };
