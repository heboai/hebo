// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "hebo",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      region: "us-east-1",
    };
  },
  async run() {
    if ($dev) {
      await import("./infra/stacks/dev/hebo-cloud");
    } else {
      await import("./infra/stacks/stage/hebo-cloud");
    }
  },
});