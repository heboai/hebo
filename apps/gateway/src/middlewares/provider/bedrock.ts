import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";

// FUTURE: Cache the inference profile ARN
export const getInferenceProfileArn = async (
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  modelId: string,
): Promise<string> => {
  const client = new BedrockClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
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
};
