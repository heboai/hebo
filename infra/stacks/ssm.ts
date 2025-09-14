import * as secrets from "./secrets";

const createParameter = (name: string, secret: sst.Secret) => {
  return new aws.ssm.Parameter(name, {
    name: `/hebo/${$app.stage}/${name}`,
    type: aws.ssm.ParameterType.SecureString,
    value: secret.value,
    overwrite: true,
  });
};

export const stackSecretServerKey = createParameter(
  "StackSecretServerKey",
  secrets.stackSecretServerKey,
);
export const dbUsername = createParameter("DbUsername", secrets.dbUsername);
export const dbPassword = createParameter("DbPassword", secrets.dbPassword);
export const groqApiKey = createParameter("GroqApiKey", secrets.groqApiKey);
export const voyageApiKey = createParameter(
  "VoyageApiKey",
  secrets.voyageApiKey,
);
