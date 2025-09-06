import { redirect, useLoaderData } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";
import { withErrorToast } from "~console/lib/errors";

import type { Route } from "./+types/route";

import { DangerSettings, createAgentDeleteSchema } from "./danger-zone";
import { GeneralSettings } from "./general";


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

// FUTURE: replace with outlet context
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { agent: (await api.agents({ agentSlug: params.slug }).get()).data };
}

function Settings() {
  const { agent } = useLoaderData<typeof clientLoader>();
  return (
    <>
      <h1>Agent Settings</h1>
      <GeneralSettings activeAgent={agent!} />
      <DangerSettings activeAgent={agent!} />
    </>
  );
}
export default Settings;

export const ErrorBoundary = withErrorToast(Settings, true);
