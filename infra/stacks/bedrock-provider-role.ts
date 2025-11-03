import heboGateway from "./gateway";

const bedrockRole = new aws.iam.Role("HeboBedrockRole4CrossAccountAssumption", {
  name: `${$app.stage}-hebo-bedrock-role-4-cross-account-assumption`,
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: heboGateway.nodes.taskRole.arn },
        Action: "sts:AssumeRole",
      },
      // FUTURE: add local role for testing when not in production
    ],
  },
  inlinePolicies: [
    {
      name: "HeboBedrockPolicy4CrossAccountAssumption",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "bedrock:InvokeModel",
              "bedrock:InvokeModelWithResponseStream",
              "bedrock:ListFoundationModels",
            ],
            Resource: "*",
          },
        ],
      }),
    },
  ],
});

export default bedrockRole;
