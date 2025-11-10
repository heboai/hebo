import { createVertex } from "@ai-sdk/google-vertex";

import { getEnvValue } from "@hebo/shared-api/utils/get-env";
import type { GoogleProviderConfig } from "@hebo/shared-data/types/provider-config";

import type { Provider } from "ai";

export function buildAwsWifOptions(
  audience: string,
  serviceAccountEmail: string,
) {
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

export const getVertexDefaultConfig =
  async (): Promise<GoogleProviderConfig> => ({
    serviceAccountEmail: await getEnvValue("VertexServiceAccountEmail"),
    audience: await getEnvValue("VertexAwsProviderAudience"),
    location: "us-central1",
    project: await getEnvValue("VertexProject"),
  });

export const createVertexProvider = async (
  config: GoogleProviderConfig,
): Promise<Provider> => {
  const { serviceAccountEmail, audience, location, project, baseURL } = config;
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
