// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

const publicEcrCredentials = aws.ecrpublic.getAuthorizationTokenOutput({});

const heboPublicRegistryInfo = {
  server: "public.ecr.aws",
  username: publicEcrCredentials.userName,
  password: publicEcrCredentials.password,
};

export default heboPublicRegistryInfo;
