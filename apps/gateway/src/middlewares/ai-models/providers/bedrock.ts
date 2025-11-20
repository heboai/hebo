import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

import type { AwsProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import type { Provider } from "./types";
import type { Provider as AiProvider } from "ai";


export type AwsTemporaryCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

// FUTURE: Cache the inference profile ARN
const getInferenceProfileArn = async (
  credentials: AwsTemporaryCredentials,
  region: string,
  modelId: string,
): Promise<string> => {
  const client = new BedrockClient({ region, credentials });
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
};

// FUTURE: Cache credentials
const getAwsCreds = async (
  bedrockRoleArn: string,
  region: string,
): Promise<AwsTemporaryCredentials> => {
  const sts = new STSClient({ region });
  const resp = await sts.send(
    new AssumeRoleCommand({
      RoleArn: bedrockRoleArn,
      RoleSessionName: "HeboBedrockSession",
    }),
  );
  if (!resp.Credentials) throw new Error("Missing AWS credentials");
  return {
    accessKeyId: resp.Credentials.AccessKeyId!,
    secretAccessKey: resp.Credentials.SecretAccessKey!,
    sessionToken: resp.Credentials.SessionToken!,
  };
};

const getBedrockDefaultConfig = async (): Promise<AwsProviderConfig> => ({
  bedrockRoleArn: await getSecret("BedrockRoleArn"),
  region: await getSecret("BedrockRegion"),
});

export class BedrockProvider implements Provider {
  private readonly configPromise: Promise<AwsProviderConfig>;
  private credentialsPromise?: Promise<AwsTemporaryCredentials>;

  constructor(config?: AwsProviderConfig) {
    this.configPromise = config
      ? Promise.resolve(config)
      : getBedrockDefaultConfig();
  }

  private async getConfig(): Promise<AwsProviderConfig> {
    return this.configPromise;
  }

  private getCredentials(): Promise<AwsTemporaryCredentials> {
    if (!this.credentialsPromise) {
      this.credentialsPromise = (async () => {
        const cfg = await this.getConfig();
        return getAwsCreds(cfg.bedrockRoleArn, cfg.region);
      })();
    }
    return this.credentialsPromise;
  }

  async create(): Promise<AiProvider> {
    const cfg = await this.getConfig();
    const creds = await this.getCredentials();
    return createAmazonBedrock({ ...creds, region: cfg.region });
  }

  async resolveModelId(id: string): Promise<string> {
    const cfg = await this.getConfig();
    const creds = await this.getCredentials();
    return getInferenceProfileArn(creds, cfg.region, id);
  }
}
