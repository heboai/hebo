import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

import { getSecret } from "@hebo/shared-api/utils/get-env";
import type { AwsProviderConfig } from "@hebo/shared-data/types/providers";

import { UpstreamAuthFailedError } from "./errors";

import type { Provider } from "ai";

// FUTURE: Cache the inference profile ARN
export const getInferenceProfileArn = async (
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
  },
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
export const getAwsCreds = async (bedrockRoleArn: string, region: string) => {
  const sts = new STSClient({ region });
  const resp = await sts.send(
    new AssumeRoleCommand({
      RoleArn: bedrockRoleArn,
      RoleSessionName: "HeboBedrockSession",
    }),
  );
  if (!resp.Credentials)
    throw new UpstreamAuthFailedError("Could not assume AWS role");
  return {
    accessKeyId: resp.Credentials.AccessKeyId!,
    secretAccessKey: resp.Credentials.SecretAccessKey!,
    sessionToken: resp.Credentials.SessionToken!,
  };
};

export const getBedrockDefaultConfig =
  async (): Promise<AwsProviderConfig> => ({
    bedrockRoleArn: await getSecret("BedrockRoleArn"),
    region: await getSecret("BedrockRegion"),
  });

export const createBedrockProvider = async (
  config: AwsProviderConfig,
): Promise<Provider> => {
  const { bedrockRoleArn, region } = config;
  const creds = await getAwsCreds(bedrockRoleArn, region);
  return createAmazonBedrock({ ...creds, region });
};

export const transformBedrockModelId = async (
  modelId: string,
  config: AwsProviderConfig,
): Promise<string> => {
  const creds = await getAwsCreds(config.bedrockRoleArn, config.region);
  return getInferenceProfileArn(creds, config.region, modelId);
};
