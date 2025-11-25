import { createVertex } from "@ai-sdk/google-vertex";

import type { GoogleProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import {
  injectMetadataCredentials,
  buildWifOptions,
} from "~gateway/middlewares/providers/adapters/aws";

import { ProviderAdapterBase, type ModelConfig } from "./providers";

import type { Provider } from "ai";

export class VertexProviderAdapter extends ProviderAdapterBase {
  private readonly configPromise: Promise<GoogleProviderConfig>;
  private providerPromise?: Promise<Provider>;

  constructor(config?: GoogleProviderConfig) {
    super("vertex");
    this.configPromise = config
      ? Promise.resolve(config)
      : (async () => {
          return {
            serviceAccountEmail: await getSecret("VertexServiceAccountEmail"),
            audience: await getSecret("VertexAwsProviderAudience"),
            location: await getSecret("VertexLocation"),
            project: await getSecret("VertexProject"),
          };
        })();
  }

  private async buildAiProvider(): Promise<Provider> {
    const cfg = await this.configPromise;
    const { serviceAccountEmail, audience, location, project, baseURL } = cfg;
    await injectMetadataCredentials();
    return createVertex({
      googleAuthOptions: {
        credentials: buildWifOptions(audience, serviceAccountEmail),
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
      location,
      project,
      baseURL,
    });
  }

  protected async getProvider(): Promise<Provider> {
    if (!this.providerPromise) {
      this.providerPromise = this.buildAiProvider();
    }
    return this.providerPromise;
  }

  protected async resolveModelId(model: ModelConfig) {
    return this.getProviderModelId(model);
  }
}
