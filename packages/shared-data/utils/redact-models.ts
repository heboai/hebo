import { providerConfigSchema } from "../types/models";

import type { Models } from "../types/models";

const MASK = "***" as const;

export function redactModels(models: Models, mask = MASK): Models {
  const variants =
    providerConfigSchema.anyOf ?? providerConfigSchema.oneOf ?? [];
  return models.map((model) => {
    const clone = structuredClone(model);
    const cr = clone.customRouting;
    if (!cr) return clone;
    const v = variants.find(
      (x) => x?.properties?.provider?.const === cr.provider,
    );
    const props = v?.properties?.config?.properties as Record<string, any>;
    if (props && cr.config && typeof cr.config === "object") {
      for (const key of Object.keys(props)) {
        if (props[key]?.["x-redact"] && key in cr.config) {
          (cr.config as Record<string, string>)[key] = mask;
        }
      }
    }
    clone.customRouting = cr;
    return clone;
  });
}
