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

const appRunnerEcrAccessRole = new aws.iam.Role("HeboAppRunnerEcrAccessRole", {
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
});

new aws.iam.RolePolicyAttachment("HeboAppRunnerEcrPolicyAttachment", {
  role: appRunnerEcrAccessRole.name,
  policyArn: ecrAccessPolicy.arn,
});

export default appRunnerEcrAccessRole;
