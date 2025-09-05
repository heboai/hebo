import { useRouteLoaderData, redirect } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";

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

    // FUTURE simplify error handling
    try {
      const result = await api.agents({ agentSlug: submission.value.slugValidate }).delete();

      if (result.error)
        // FUTURE: helper for error parsing
        return submission.reply({ formErrors: [String(result.error.value)] });

      return redirect("/");

    } catch (e: unknown) {
      // FUTURE: helper for error parsing
      return submission.reply({ formErrors: [ (e as Error).message] });
    }
}

export default function Settings() {
  const { activeAgent } = useRouteLoaderData("routes/_shell");

  return (
    <>
      <h1>Agent Settings</h1>

      <GeneralSettings activeAgent={activeAgent} />

      <DangerSettings activeAgent={activeAgent} />
    </>
  );
}
