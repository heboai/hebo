import { createVertex } from "@ai-sdk/google-vertex";

import type { GoogleProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import * as awsAdapter from "./adapters/aws";

import type { Provider } from "./providers";
import type { Provider as AiProvider } from "ai";

export class VertexProvider implements Provider {
  private readonly configPromise: Promise<GoogleProviderConfig>;

  constructor(config?: GoogleProviderConfig) {
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

  async create(): Promise<AiProvider> {
    const cfg = await this.configPromise;
    const { serviceAccountEmail, audience, location, project, baseURL } = cfg;
    await awsAdapter.injectAwsMetadataCredentials();
    const credentials = awsAdapter.buildAwsWifOptions(
      audience,
      serviceAccountEmail,
    ) as any;
    return createVertex({
      googleAuthOptions: {
        credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
      location,
      project,
      baseURL,
    });
  }

  async resolveModelId(id: string): Promise<string> {
    return id;
  }
}
