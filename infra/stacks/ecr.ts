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

const defineServiceRepository = (serviceName: ServiceName) =>
  new aws.ecr.Repository(`hebo-${serviceName}`, {
    forceDelete: true,
    imageScanningConfiguration: { scanOnPush: true },
  });

type ServiceName = "api" | "gateway";

const dockerTag = $app.stage === "production" ? "latest" : `${$app.stage}`;

export const defineServiceImage = (serviceName: ServiceName) => {
  const repo = defineServiceRepository(serviceName);
  const dockerfilePath =
    serviceName === "api"
      ? "../../infra/stacks/docker/Dockerfile.api"
      : "../../infra/stacks/docker/Dockerfile.gateway";

  return new docker.Image(`hebo-${serviceName}-image`, {
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
