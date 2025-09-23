const heboVpc = new sst.aws.Vpc("HeboVpc", { nat: "managed" });

export default heboVpc;
