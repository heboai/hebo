import { redirect, useRouteLoaderData } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";
import { dontRevalidateOnFormErrors, parseError } from "~console/lib/errors";

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

  let result;
  try {
    result = await api.agents({ agentSlug: submission.value.slugValidate }).delete();
  } catch (error) {
    return submission.reply({ formErrors: [ parseError(error).message ] });
  }

  if (result.error)
    return submission.reply({ formErrors: [String(result.error.value)] });

  return redirect("/");
}

export { dontRevalidateOnFormErrors as shouldRevalidate }


export default function Settings() {
  const { agent } = useRouteLoaderData("routes/_shell.agent.$slug");
 
  return (
    <>
      <h1>Agent Settings</h1>
      <GeneralSettings agent={agent} />
      <DangerSettings agent={agent} />
    </>
  );
}