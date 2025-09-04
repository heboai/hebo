// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

const ecrAccessPolicy = new aws.iam.Policy("HeboAppRunnerEcrAccessPolicy", {
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ],
        Resource: "*",
      },
    ],
  },
});

export const appRunnerEcrAccessRole = new aws.iam.Role(
  "HeboAppRunnerEcrAccessRole",
  {
    assumeRolePolicy: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Service: "build.apprunner.amazonaws.com",
          },
          Action: "sts:AssumeRole",
        },
      ],
    },
  },
);

// eslint-disable-next-line sonarjs/constructor-for-side-effects, no-secrets/no-secrets
new aws.iam.RolePolicyAttachment("HeboAppRunnerEcrPolicyAttachment", {
  role: appRunnerEcrAccessRole.name,
  policyArn: ecrAccessPolicy.arn,
});

export const ecrAuth = aws.ecr.getAuthorizationTokenOutput({});

export const heboApiRepo = new aws.ecr.Repository("hebo-api", {
  forceDelete: true,
  imageScanningConfiguration: { scanOnPush: true },
});

export const heboGatewayRepo = new aws.ecr.Repository("hebo-gateway", {
  forceDelete: true,
  imageScanningConfiguration: { scanOnPush: true },
});
