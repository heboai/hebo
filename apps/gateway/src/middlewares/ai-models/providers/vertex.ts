import { createVertex } from "@ai-sdk/google-vertex";

import type { GoogleProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import type { AwsTemporaryCredentials } from "./bedrock";
import type { Provider } from "./types";
import type { Provider as AiProvider } from "ai";

type AwsContainerCredentialResponse = {
  AccessKeyId: string;
  SecretAccessKey: string;
  Token: string;
};

const toTemporaryCredentials = (
  credentials: AwsContainerCredentialResponse,
): AwsTemporaryCredentials => ({
  accessKeyId: credentials.AccessKeyId,
  secretAccessKey: credentials.SecretAccessKey,
  sessionToken: credentials.Token,
});

// FUTURE: Cache credentials, or memoize with TTL the upstream provider
// FUTURE: Let google auth library handle this once they will start supporting WIF for ECS tasks: https://github.com/googleapis/google-auth-library-php/issues/496
const injectAwsMetadataCredentials = async () => {
  if (!process.env.IS_REMOTE) return;
  const response = await fetch(
    `http://169.254.170.2${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`,
  );
  const rawCredentials =
    (await response.json()) as AwsContainerCredentialResponse;
  const credentials = toTemporaryCredentials(rawCredentials);
  process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
  process.env.AWS_SESSION_TOKEN = credentials.sessionToken;
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

const getVertexDefaultConfig = async (): Promise<GoogleProviderConfig> => ({
  serviceAccountEmail: await getSecret("VertexServiceAccountEmail"),
  audience: await getSecret("VertexAwsProviderAudience"),
  location: await getSecret("VertexLocation"),
  project: await getSecret("VertexProject"),
});

export class VertexProvider implements Provider {
  private readonly configPromise: Promise<GoogleProviderConfig>;

  constructor(config?: GoogleProviderConfig) {
    this.configPromise = config
      ? Promise.resolve(config)
      : getVertexDefaultConfig();
  }

  private async getConfig(): Promise<GoogleProviderConfig> {
    return this.configPromise;
  }

  async create(): Promise<AiProvider> {
    const cfg = await this.getConfig();
    const { serviceAccountEmail, audience, location, project, baseURL } = cfg;
    await injectAwsMetadataCredentials();
    const credentials = buildAwsWifOptions(
      audience,
      serviceAccountEmail,
    ) as any;
    return createVertex({
      googleAuthOptions: {
        credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
      location,
      project,
      baseURL,
    });
  }

  async resolveModelId(id: string): Promise<string> {
    return id;
  }
}
