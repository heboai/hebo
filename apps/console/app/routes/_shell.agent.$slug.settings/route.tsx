import { useRouteLoaderData, redirect } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";

import type { Route } from "./+types/route";

import { DangerSettings, createAgentDeleteSchema } from "./danger-zone";
import { GeneralSettings } from "./general";
import { useErrorToast } from "~console/lib/errors";

export async function clientAction({ request }: Route.ClientActionArgs ) {
  const formData = await request.formData();

  const submission = parseWithValibot(
    formData,
    { schema: createAgentDeleteSchema(String(formData.get('slugValidate'))) }
  );
  
  if (submission.status !== 'success')
    return submission.reply();

  const result = await api.agents({ agentSlug: submission.value.slugValidate }).delete();

  if (result.error)
    return submission.reply({ formErrors: [String(result.error.value)] });

  return redirect("/");
}

function Settings() {
  useErrorToast();

  const { activeAgent } = useRouteLoaderData("routes/_shell");

  return (
    <>
      <h1>Agent Settings</h1>

      <GeneralSettings activeAgent={activeAgent} />

      <DangerSettings activeAgent={activeAgent} />
    </>
  );
}
export default Settings;

export const ErrorBoundary = Settings;
