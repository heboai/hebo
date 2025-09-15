// Auth
const _stackSecretServerKey = new sst.Secret("StackSecretServerKey");

// Database
export const _dbUsername = new sst.Secret("DbUsername");
export const _dbPassword = new sst.Secret("DbPassword");

// LLMs
export const _groqApiKey = new sst.Secret("GroqApiKey");
export const _voyageApiKey = new sst.Secret("VoyageApiKey");
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
  _stackSecretServerKey,
);
export const dbUsername = createParameter("DbUsername", _dbUsername);
export const dbPassword = createParameter("DbPassword", _dbPassword);
export const groqApiKey = createParameter("GroqApiKey", _groqApiKey);
export const voyageApiKey = createParameter("VoyageApiKey", _voyageApiKey);
