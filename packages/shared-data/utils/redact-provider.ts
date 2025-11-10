import { ProviderConfig } from "../types/providers";

const MASK = "***" as const;

export function redactProviderConfig(
  config: ProviderConfig,
  mask = MASK,
): ProviderConfig {
  const variants = ProviderConfig.anyOf ?? ProviderConfig.oneOf ?? [];
  const clone = structuredClone(config) as Record<string, unknown>;
  for (const variant of variants) {
    const props = (variant?.properties ?? {}) as Record<string, any>;
    for (const key of Object.keys(props)) {
      if (props[key]?.["x-redact"] && key in clone) {
        clone[key] = mask;
      }
    }
  }
  return clone as ProviderConfig;
}
