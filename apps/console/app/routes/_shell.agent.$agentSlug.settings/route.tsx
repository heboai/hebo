import { redirect, unstable_useRoute } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/service";
import { parseError } from "~console/lib/errors";

import type { Route } from "./+types/route";

import { DangerSettings, createAgentDeleteSchema } from "./danger-zone";
import { GeneralSettings } from "./general";


export async function clientAction({ request, params }: Route.ClientActionArgs ) {
  const formData = await request.formData();

  const submission = parseWithValibot(formData, {
     schema: createAgentDeleteSchema(params.agentSlug)
  });
  
  if (submission.status !== 'success')
    return submission.reply();

  let result;
  try {
    result = await api.agents({ agentSlug: params.agentSlug }).delete();
  } catch (error) {
    return submission.reply({ formErrors: [ parseError(error).message ] });
  }

  if (result.error)
    return submission.reply({ formErrors: [String(result.error?.value)] });

  return redirect("/");
}


export default function Settings() {
  const agent = unstable_useRoute("routes/_shell.agent.$agentSlug")!.loaderData!.agent!;
 
  return (
    <>
      <h1>Agent Settings</h1>
      <GeneralSettings agent={agent} />
      <DangerSettings agent={agent} />
    </>
  );
}
