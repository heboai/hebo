import heboGateway from "./gateway";

const AWS_ACCOUNT_ID = "160885286799";
const GOOGLE_PROJECT_NUMBER = "111566845594034750701";

const googleVertexServiceAccount = new gcp.serviceaccount.Account(
  "GoogleVertexServiceAccount",
  {
    accountId: "google-vertex-service-account",
    displayName: "Service account for Google Vertex",
  },
);

const googleVertexWorkloadIdentityPool = new gcp.iam.WorkloadIdentityPool(
  "GoogleVertexWorkloadIdentityPool",
  {
    workloadIdentityPoolId: "google-vertex-workload-identity-pool",
    displayName: "Google Vertex workload identity pool",
    description: "Pool for Google Vertex → AWS federation",
  },
);

const googleVertexAwsProvider = new gcp.iam.WorkloadIdentityPoolProvider(
  "google-vertex-aws-provider",
  {
    workloadIdentityPoolId:
      googleVertexWorkloadIdentityPool.workloadIdentityPoolId,
    workloadIdentityPoolProviderId: "google-vertex-aws-provider",
    displayName: "Google Vertex AWS provider",
    description: "Provider for Google Vertex → AWS federation",
    aws: {
      accountId: AWS_ACCOUNT_ID,
    },
    attributeMapping: {
      "google.subject": "assertion.arn",
      "attribute.aws_role": "assertion.arn.extract('assumed-role/{role}/')",
      "attribute.account": "assertion.account",
    },
    attributeCondition: $interpolate`assertion.arn.startsWith('${heboGateway.nodes.taskRole.arn}')`,
  },
);

// eslint-disable-next-line sonarjs/constructor-for-side-effects
new gcp.serviceaccount.IAMMember("google-vertex-service-account-binding", {
  serviceAccountId: googleVertexServiceAccount.name,
  role: "roles/iam.workloadIdentityUser",
  member: $interpolate`principalSet://iam.googleapis.com/projects/${GOOGLE_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${googleVertexWorkloadIdentityPool.workloadIdentityPoolId}/attribute.aws_role/${heboGateway.nodes.taskRole.name}`,
});

export default googleVertexAwsProvider;
