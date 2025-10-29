import { ProviderConfigConfig } from "../types/provider-config";

const MASK = "***" as const;

export function redactProviderConfig(
  config: ProviderConfigConfig,
  mask = MASK,
): ProviderConfigConfig {
  const variants =
    ProviderConfigConfig.anyOf ?? ProviderConfigConfig.oneOf ?? [];
  const clone = structuredClone(config) as Record<string, unknown>;
  for (const variant of variants) {
    const props = (variant?.properties ?? {}) as Record<string, any>;
    for (const key of Object.keys(props)) {
      if (props[key]?.["x-redact"] && key in clone) {
        clone[key] = mask;
      }
    }
  }
  return clone as ProviderConfigConfig;
}
