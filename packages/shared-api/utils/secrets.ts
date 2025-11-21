import { secrets } from "bun";
import { Resource } from "sst";

export const getSecret = async (name: string) => {
  try {
    // @ts-expect-error: Resource may not be defined
    return Resource[name].value;
  } catch {
    return await secrets.get({ service: "hebo", name });
  }
};
