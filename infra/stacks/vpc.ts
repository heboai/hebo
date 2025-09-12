export const heboVpc = new sst.aws.Vpc("HeboVpc", {
  nat: "ec2",
  bastion: $app.stage !== "production",
});
