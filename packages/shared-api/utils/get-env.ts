import { secrets } from "bun";
import { Resource } from "sst";

export const getEnvValue = async (name: string) => {
  try {
    return (Resource as any)[name].value;
  } catch {
    return await secrets.get({ service: "hebo", name });
  }
};
