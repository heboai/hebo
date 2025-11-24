import { createVertex } from "@ai-sdk/google-vertex";

import type { GoogleProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import type { Provider } from "./providers";
import type { Provider as AiProvider } from "ai";

type AwsContainerCredentialResponse = {
  AccessKeyId: string;
  SecretAccessKey: string;
  Token: string;
};

export class VertexProvider implements Provider {
  private readonly configPromise: Promise<GoogleProviderConfig>;

  constructor(config?: GoogleProviderConfig) {
    this.configPromise = config
      ? Promise.resolve(config)
      : (async () => {
          return {
            serviceAccountEmail: await getSecret("VertexServiceAccountEmail"),
            audience: await getSecret("VertexAwsProviderAudience"),
            location: await getSecret("VertexLocation"),
            project: await getSecret("VertexProject"),
          };
        })();
  }

  // FUTURE: Let google auth library handle this once they will start supporting WIF for ECS tasks: https://github.com/googleapis/google-auth-library-php/issues/496
  private static async injectAwsMetadataCredentials(): Promise<void> {
    if (!process.env.IS_REMOTE) return;
    const response = await fetch(
      `http://169.254.170.2${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`,
    );
    const credentials =
      (await response.json()) as AwsContainerCredentialResponse;
    process.env.AWS_ACCESS_KEY_ID = credentials.AccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = credentials.SecretAccessKey;
    process.env.AWS_SESSION_TOKEN = credentials.Token;
  }

  private static buildAwsWifOptions(
    audience: string,
    serviceAccountEmail: string,
  ): any {
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
  }

  async create(): Promise<AiProvider> {
    const cfg = await this.configPromise;
    const { serviceAccountEmail, audience, location, project, baseURL } = cfg;
    await VertexProvider.injectAwsMetadataCredentials();
    const credentials = VertexProvider.buildAwsWifOptions(
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
