import { Outlet } from "react-router";

import { ErrorView } from "~console/components/ui/ErrorView";
import { api } from "~console/lib/data";
import { dontRevalidateOnFormErrors } from "~console/lib/errors";

import type { Route } from "./+types/route";


export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const result = await api
    .agents({ agentSlug: params.agentSlug })
    .get({ query: { expand: "branches" } });

  if (result.error?.status === 404)
    throw new Response(`Agent '${params.agentSlug}' does not exist`, {
      status: 404, statusText: "Not Found"
    });

  // Always fetch latest branches list from the branches endpoint to reflect newly created branches
  const branchesResult = await api
    .agents({ agentSlug: params.agentSlug })
    .branches.get();

  const branches = branchesResult.data;

  return { agent: { ...(result.data), branches } };
}

export { dontRevalidateOnFormErrors as shouldRevalidate }


export default function AgentLayout() {
  return <div className="mx-auto max-w-2xl min-w-0 w-full flex flex-col gap-6"><Outlet /></div>;
}

export function ErrorBoundary () {
  return <ErrorView />;
};
