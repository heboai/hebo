import { ProviderConfig } from "../types/provider-config";

const MASK = "***" as const;

export function redactProviderConfig(
  config: ProviderConfig,
  mask = MASK,
): ProviderConfig {
  const variants = ProviderConfig.anyOf ?? ProviderConfig.oneOf ?? [];

  const clone = structuredClone(config);
  const v = variants.find(
    (x) => x?.properties?.provider?.const === clone.provider,
  );
  const props = v?.properties?.config?.properties as Record<string, any>;
  if (props && clone.config && typeof clone.config === "object") {
    for (const key of Object.keys(props)) {
      if (props[key]?.["x-redact"] && key in clone.config) {
        (clone.config as Record<string, unknown>)[key] = mask;
      }
    }
  }
  return clone;
}
