import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";

import type { BedrockProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";
import { getReasoningConfig } from "@hebo/shared-data/models/index";

import type { OpenAICompatibleReasoning } from "~gateway/utils/openai-compatible-api-schemas";

import { assumeRole } from "./adapters/aws";
import { ProviderAdapterBase, type ProviderAdapter } from "./provider";

type BedrockCredentials =
  ReturnType<typeof assumeRole> extends Promise<infer T> ? T : never;

export class BedrockProviderAdapter
  extends ProviderAdapterBase
  implements ProviderAdapter
{
  private config?: BedrockProviderConfig;
  private credentials?: BedrockCredentials;

  constructor(modelName: string) {
    super("bedrock", modelName);
  }

  protected getProviderName(): string {
    return "bedrock";
  }

  private static toSnakeCase(str: string): string {
    return str.replaceAll(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static convertObjectKeysToSnakeCase(
    obj: Record<string, any>,
  ): Record<string, any> {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[BedrockProviderAdapter.toSnakeCase(key)] = obj[key];
      }
    }
    return newObj;
  }

  getProviderOptions(reasoning?: OpenAICompatibleReasoning): any {
    if (!reasoning) return;

    const config = getReasoningConfig(this.modelName, reasoning);

    if (!config || Object.keys(config).length === 0) return;

    const snakeCaseConfig =
      BedrockProviderAdapter.convertObjectKeysToSnakeCase(config);

    return {
      bedrock: {
        additionalModelRequestFields: snakeCaseConfig,
      },
    };
  }

  private async getCredentials() {
    if (!this.credentials) {
      const cfg = this.config!;
      this.credentials = await assumeRole(cfg.region, cfg.bedrockRoleArn);
    }
    return this.credentials;
  }

  async initialize(config?: BedrockProviderConfig): Promise<this> {
    if (config) {
      this.config = config;
    } else {
      const [bedrockRoleArn, region] = await Promise.all([
        getSecret("BedrockRoleArn"),
        getSecret("BedrockRegion"),
      ]);
      this.config = { bedrockRoleArn, region };
    }
    return this;
  }

  async getProvider() {
    const credentials = await this.getCredentials();
    const { region } = this.config!;
    return createAmazonBedrock({
      ...credentials,
      region,
    });
  }

  async resolveModelId() {
    const modelId = this.getProviderModelId();
    const { region } = this.config!;
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
