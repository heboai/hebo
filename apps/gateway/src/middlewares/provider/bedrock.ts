import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";
import {
  STSClient,
  AssumeRoleCommand,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";

import { getSecret } from "@hebo/shared-api/utils/get-env";
import type { AwsProviderConfig } from "@hebo/shared-data/types/provider-config";

import { UpstreamAuthFailedError } from "./errors";

import type { Provider } from "ai";

const BEDROCK_REGION = process.env.BEDROCK_REGION ?? "us-east-1";

// FUTURE: Cache the inference profile ARN
// FUTURE: try to achieve the same using @aws-sdk/client-sts
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

// FUTURE: Cache the account id
const getAwsAccountId = async (): Promise<string> => {
  const stsClient = new STSClient({ region: BEDROCK_REGION });
  const response = await stsClient.send(new GetCallerIdentityCommand({}));
  if (!response.Account)
    throw new UpstreamAuthFailedError("Could not retrieve AWS account id");
  return response.Account;
};

// FUTURE: Cache the credentials
export const getAwsCreds = async (bedrockRoleArn: string, region: string) => {
  const accountId = await getAwsAccountId();
  const fullRoleArn = `arn:aws:iam::${accountId}:role/${bedrockRoleArn}`;
  const sts = new STSClient({ region });
  const resp = await sts.send(
    new AssumeRoleCommand({
      RoleArn: fullRoleArn,
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
    region: BEDROCK_REGION,
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
