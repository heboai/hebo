import { Outlet } from "react-router";

import { ErrorView } from "~console/components/ui/ErrorView";
import { api } from "~console/lib/data";

import type { Route } from "./+types/route";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { data: agent } = await api.agents({ agentSlug: params.slug }).get();

  if (agent == null)
    throw new Response(`Agent '${params.slug}' does not exist`, { status: 404, statusText: "Not Found" });

  return { agent };
}

export default function AgentLayout() {
  return <div className="max-w-2xl flex flex-col gap-6"><Outlet /></div>;
}

export function ErrorBoundary () {
  return <ErrorView />;
};
