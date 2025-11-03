import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";
import {
  STSClient,
  AssumeRoleCommand,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";

import { UpstreamAuthFailedError } from "./errors";

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
  const stsClient = new STSClient({ region: "us-east-1" });
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
