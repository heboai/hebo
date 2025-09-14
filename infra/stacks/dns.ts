const ZONE_NAME = "hebo.ai";

export const heboZone = new aws.route53.Zone(
  "HeboZone",
  {
    name: ZONE_NAME,
  },
  {
    retainOnDelete: true,
    import: "Z04925831LRULWYM06Z5M",
  },
);

export const getDomain = (appName: string) => {
  const stagePrefix = $app.stage === "production" ? "" : $app.stage + ".";
  return `${appName}.${stagePrefix}${ZONE_NAME}`;
};
