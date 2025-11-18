import { createVertex } from "@ai-sdk/google-vertex";

import { getSecret } from "@hebo/shared-api/utils/secrets";
import type { GoogleProviderConfig } from "@hebo/shared-data/types/providers";

import type { Provider } from "ai";

type AwsContainerCredentials = {
  AccessKeyId: string;
  SecretAccessKey: string;
  Token: string;
};

// FUTURE: Cache credentials, or memoize with TTL the upstream provider
// FUTURE: Let google auth library handle this once they will start supporting WIF for ECS tasks: https://github.com/googleapis/google-auth-library-php/issues/496
const injectAwsMetadataCredentials = async () => {
  if (!process.env.IS_REMOTE) return;
  const response = await fetch(
    `http://169.254.170.2${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`,
  );
  const credentials = (await response.json()) as AwsContainerCredentials;
  process.env.AWS_ACCESS_KEY_ID = credentials.AccessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = credentials.SecretAccessKey;
  process.env.AWS_SESSION_TOKEN = credentials.Token;
};

const buildAwsWifOptions = (audience: string, serviceAccountEmail: string) => {
  return {
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:aws:token-type:aws4_request",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    credential_source: {
      environment_id: "aws1",
      regional_cred_verification_url:
        "https://sts.{region}.amazonaws.com?Action=GetCallerIdentity&Version=2011-06-15",
    },
  };
};

export const getVertexDefaultConfig =
  async (): Promise<GoogleProviderConfig> => ({
    serviceAccountEmail: await getSecret("VertexServiceAccountEmail"),
    audience: await getSecret("VertexAwsProviderAudience"),
    location: await getSecret("VertexLocation"),
    project: await getSecret("VertexProject"),
  });

export const createVertexProvider = async (
  config: GoogleProviderConfig,
): Promise<Provider> => {
  const { serviceAccountEmail, audience, location, project, baseURL } = config;
  await injectAwsMetadataCredentials();
  const credentials = buildAwsWifOptions(audience, serviceAccountEmail) as any;
  return createVertex({
    googleAuthOptions: {
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    },
    location,
    project,
    baseURL,
  });
};
