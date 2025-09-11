"use client";

import type { Route } from "./+types/route";
import ModelConfigurationForm from "./form";
export { clientAction } from "./form";

export default function AgentBranchConfig({ loaderData, actionData }: Route.ComponentProps) {
  return <ModelConfigurationForm />;
}
