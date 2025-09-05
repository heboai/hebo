// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

const ecrAccessPolicy = new aws.iam.Policy("HeboEcrAccessPolicy", {
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

const ecrAuth = aws.ecr.getAuthorizationTokenOutput({});

const repo = new aws.ecr.Repository("HeboRepository", {
  name: "hebo",
  imageScanningConfiguration: { scanOnPush: true },
  forceDelete: true,
});

export const createDockerImage = (
  dockerfilePath: string,
  dockerTag: string,
) => {
  return new docker.Image(`HeboImage-${dockerTag}`, {
    build: {
      context: "../../",
      dockerfile: dockerfilePath,
      platform: "linux/amd64",
    },
    imageName: $interpolate`${repo.repositoryUrl}:${dockerTag}`,
    registry: {
      server: repo.repositoryUrl.apply((url) => {
        const parts = url.split("/");
        return parts.slice(0, -1).join("/");
      }),
      username: ecrAuth.userName,
      password: ecrAuth.password,
    },
  });
};
