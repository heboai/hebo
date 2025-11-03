export function buildAwsWifOptions(params: {
  audience: string;
  serviceAccountEmail: string;
}) {
  return {
    type: "external_account",
    audience: params.audience,
    subject_token_type: "urn:ietf:params:aws:token-type:aws4_request",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${params.serviceAccountEmail}:generateAccessToken`,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    credential_source: {
      environment_id: "aws1",
      regional_cred_verification_url:
        "https://sts.{region}.amazonaws.com?Action=GetCallerIdentity&Version=2011-06-15",
    },
  };
}
