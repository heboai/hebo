const ZONE_NAME = "hebo.ai";

const createZoneIfNotExists = async (zoneName: string) => {
  (await aws.route53.getZone({ name: zoneName })) ||
    new aws.route53.Zone(
      "HeboZone",
      {
        name: zoneName,
      },
      {
        retainOnDelete: true,
      },
    );
  return zoneName;
};

export const getDomain = async (service: string) => {
  const zoneName = await createZoneIfNotExists(ZONE_NAME);
  return $app.stage === "production"
    ? `${service}.${zoneName}`
    : `${$app.stage}.dev.${service}.${zoneName}`;
};
