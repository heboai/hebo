// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "hebo-cloud",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: input?.stage === "production" || input?.stage?.includes("preview") ? { cloudflare: "6.2.0" } : { aws: true },
    };
  },
  async run() {
    const domain = $app.stage === "production"
      ? { name: "cloud.hebo.ai", dns: sst.cloudflare.dns() }
      : $app.stage.includes("preview")
        ? { name: "cloud-" + $app.stage + ".hebo.ai", dns: sst.cloudflare.dns() }
        : undefined;
    new sst.aws.Nextjs("HeboCloudApp", {
      domain: domain
    });
  },
});
