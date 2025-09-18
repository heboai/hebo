// FUTURE: Use an existing default VPC for non production stages
export const heboVpc = new sst.aws.Vpc("HeboVpc", {
  nat: "managed",
});
