import { useRouteLoaderData, redirect } from "react-router";

import { api } from "~console/lib/data";

import type { Route } from "./+types/route";

import { DangerSettings } from "./danger-zone";
import { GeneralSettings } from "./general";


export async function clientAction({ request }: Route.ClientActionArgs ) {
    const formData = await request.formData();

    const result = await api.agents({ agentSlug: String(formData.get("slug")) }).delete();

    return result.error
      ? { error: result.error.value?.toString() }
      : redirect("/");
}

export default function Settings({ actionData }: Route.ComponentProps) {
  const { activeAgent } = useRouteLoaderData("routes/_shell");

  return (
    <>
      <h1>Agent Settings</h1>

      <GeneralSettings activeAgent={activeAgent} />

      <DangerSettings activeAgent={activeAgent} error={actionData?.error} />
    </>
  );
}
