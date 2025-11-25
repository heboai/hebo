import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";

import type { AwsProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { assumeRole } from "./adapters/aws";
import { ProviderAdapterBase } from "./provider";

type BedrockCredentials =
  ReturnType<typeof assumeRole> extends Promise<infer T> ? T : never;

export class BedrockProviderAdapter extends ProviderAdapterBase {
  private config?: AwsProviderConfig;
  private credentials?: BedrockCredentials;

  constructor(modelName: string, config?: AwsProviderConfig) {
    super("bedrock", modelName);
    this.config = config;
  }

  private async getConfig(): Promise<AwsProviderConfig> {
    if (!this.config) {
      const [bedrockRoleArn, region] = await Promise.all([
        getSecret("BedrockRoleArn"),
        getSecret("BedrockRegion"),
      ]);
      this.config = { bedrockRoleArn, region };
    }
    return this.config;
  }

  private async getCredentials() {
    if (!this.credentials) {
      const cfg = await this.getConfig();
      this.credentials = await assumeRole(cfg.region, cfg.bedrockRoleArn);
    }
    return this.credentials;
  }

  async getProvider() {
    const credentials = await this.getCredentials();
    const { region } = await this.getConfig();
    return createAmazonBedrock({
      ...credentials,
      region,
    });
  }

  async resolveModelId() {
    const modelId = this.getProviderModelId();
    const { region } = await this.getConfig();
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
