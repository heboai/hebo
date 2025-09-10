const ZONE_NAME = "hebo.ai";

const createZoneIfNotExists = async (zoneName: string) => {
  try {
    await aws.route53.getZone({ name: zoneName });
  } catch {
    // eslint-disable-next-line sonarjs/constructor-for-side-effects
    new aws.route53.Zone(
      "HeboZone",
      {
        name: zoneName,
      },
      {
        retainOnDelete: true,
      },
    );
  }
  return zoneName;
};

export const getDomain = async (appName: string) => {
  const zoneName = await createZoneIfNotExists(ZONE_NAME);
  return $app.stage === "production"
    ? `${appName}.${zoneName}`
    : `${$app.stage}.dev.${appName}.${zoneName}`;
};
