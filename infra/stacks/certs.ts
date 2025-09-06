// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

const { zoneId } = await aws.route53.getZone({
  name: "hebo.ai",
});

export const createCnameRecords = (
  domain: string,
  customDomainAssociation: aws.apprunner.CustomDomainAssociation,
) => {
  // eslint-disable-next-line sonarjs/constructor-for-side-effects
  new aws.route53.Record(`${domain}Cname`, {
    zoneId,
    name: domain,
    type: "CNAME",
    ttl: 60,
    records: [customDomainAssociation.dnsTarget],
  });

  customDomainAssociation.certificateValidationRecords.apply((recs) =>
    recs.map(
      (r, i) =>
        new aws.route53.Record(`${domain}CertValidation-${i}`, {
          zoneId,
          name: r.name,
          type: r.type,
          ttl: 60,
          records: [r.value],
          allowOverwrite: true,
        }),
    ),
  );
};
