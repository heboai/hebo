import { ProviderConfigValue } from "../types/providers";

const MASK = "***" as const;

export function redactProviderConfigValue(
  value: ProviderConfigValue,
  mask = MASK,
): ProviderConfigValue {
  const variants = ProviderConfigValue.anyOf ?? ProviderConfigValue.oneOf ?? [];
  const clone = structuredClone(value) as Record<string, unknown>;
  for (const variant of variants) {
    const props = (variant?.properties ?? {}) as Record<string, any>;
    for (const key of Object.keys(props)) {
      if (props[key]?.["x-redact"] && key in clone) {
        clone[key] = mask;
      }
    }
  }
  return clone as ProviderConfigValue;
}
