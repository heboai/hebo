
import { Badge } from "@hebo/shared-ui/components/Badge";
import { Select } from "@hebo/shared-ui/components/Select";

import { supportedModels } from "~console/routes/_shell.agent.$agentSlug.branch.$branchSlug.models/schema";

import type { ComponentProps } from "react";

type ModelSelectorProps = Omit<
  ComponentProps<typeof Select>,
  "items" | "placeholder"
> & { placeholder?: string };

export default function ModelSelector({
  placeholder = "Select the model",
  ...props
}: ModelSelectorProps) {
  return (
    <Select
      {...props}
      items={supportedModels.map((m) => ({
        value: m.type,
        name: (
          <>
            {m.displayName}{" "}
            {m.monthlyFreeTokens && (
              <Badge className="bg-green-600 text-white">Free Tier</Badge>
            )}
            {m.modality === "embedding" && (
              <Badge className="bg-blue-500 text-white">Embeddings</Badge>
            )}
          </>
        ),
      }))}
      placeholder={placeholder}
    />
  );
}
