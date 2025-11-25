import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";

import type { AwsProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { assumeRole } from "~gateway/middlewares/providers/adapters/aws";

import { ProviderAdapterBase } from "./providers";

import type { Provider } from "ai";

export class BedrockProviderAdapter extends ProviderAdapterBase {
  private readonly configPromise: Promise<AwsProviderConfig>;
  private credentialsPromise?: ReturnType<typeof assumeRole>;

  constructor(modelName: string, config?: AwsProviderConfig) {
    super("bedrock", modelName);
    this.configPromise = config
      ? Promise.resolve(config)
      : (async () => {
          return {
            bedrockRoleArn: await getSecret("BedrockRoleArn"),
            region: await getSecret("BedrockRegion"),
          };
        })();
  }

  private async getCredentials() {
    if (!this.credentialsPromise) {
      this.credentialsPromise = this.configPromise.then((cfg) =>
        assumeRole(cfg.region, cfg.bedrockRoleArn),
      );
    }
    return this.credentialsPromise;
  }

  async getProvider(): Promise<Provider> {
    const credentials = await this.getCredentials();
    const { region } = await this.configPromise;
    return createAmazonBedrock({
      ...credentials,
      region,
    });
  }

  async resolveModelId() {
    const modelId = await this.getProviderModelId();
    const { region } = await this.configPromise;
    const client = new BedrockClient({
      region,
      credentials: await this.getCredentials(),
    });
    let nextToken: string | undefined;
    do {
      const res = await client.send(
        new ListInferenceProfilesCommand({ nextToken }),
      );
      for (const prof of res.inferenceProfileSummaries ?? []) {
        const arn = prof.inferenceProfileArn ?? "";
        if (arn.includes(modelId)) {
          return arn;
        }
      }
      nextToken = res.nextToken;
    } while (nextToken);
    return modelId;
  }
}
