import { createVertex } from "@ai-sdk/google-vertex";

import type { GoogleProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import {
  injectMetadataCredentials,
  buildWifOptions,
} from "~gateway/middlewares/providers/adapters/aws";

import { ProviderAdapterBase } from "./provider";

import type { Provider } from "ai";

export class VertexProviderAdapter extends ProviderAdapterBase {
  private config?: GoogleProviderConfig;

  constructor(modelName: string, config?: GoogleProviderConfig) {
    super("vertex", modelName);
    this.config = config;
  }

  private async getConfig(): Promise<GoogleProviderConfig> {
    if (!this.config) {
      const [serviceAccountEmail, audience, location, project] =
        await Promise.all([
          getSecret("VertexServiceAccountEmail"),
          getSecret("VertexAwsProviderAudience"),
          getSecret("VertexLocation"),
          getSecret("VertexProject"),
        ]);
      this.config = {
        serviceAccountEmail,
        audience,
        location,
        project,
      };
    }
    return this.config;
  }

  async getProvider(): Promise<Provider> {
    const cfg = await this.getConfig();
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

  async resolveModelId() {
    return this.getProviderModelId();
  }
}
