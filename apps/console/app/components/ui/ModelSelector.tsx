import { Badge } from "@hebo/shared-ui/components/Badge";
import { Select } from "@hebo/shared-ui/components/Select";

import { supportedModels } from "~console/routes/_shell.agent.$agentSlug.branch.$branchSlug.models/schema";

export default function ModelSelector() {
  return (
    <Select
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
      placeholder="Select the model"
    />
  );
}
