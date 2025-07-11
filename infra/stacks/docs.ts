// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />


const heboDocs = new sst.aws.Nextjs("HeboDocs", {
  path: "apps/docs",
  domain: $app.stage === "production" ? "docs.hebo.ai" : `${$app.stage}.docs.hebo.ai`,
});

export default heboDocs;
