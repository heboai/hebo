import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";

import type { AwsProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { assumeRole } from "./adapters/aws";

import type { Provider } from "./providers";
import type { Provider as AiProvider } from "ai";

export class BedrockProvider implements Provider {
  private readonly configPromise: Promise<AwsProviderConfig>;
  private credentialsPromise?: ReturnType<typeof assumeRole>;

  constructor(config?: AwsProviderConfig) {
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

  async create(): Promise<AiProvider> {
    const credentials = await this.getCredentials();
    const { region } = await this.configPromise;
    return createAmazonBedrock({
      ...credentials,
      region,
    });
  }

  async resolveModelId(id: string): Promise<string> {
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
        if (arn.includes(id)) {
          return arn;
        }
      }
      nextToken = res.nextToken;
    } while (nextToken);
    return id;
  }
}
