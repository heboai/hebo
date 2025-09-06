import { Outlet, useLoaderData, useParams, useRouteLoaderData } from "react-router";
import { useSnapshot } from "valtio";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@hebo/ui/components/Sidebar";

import { authService } from "~console/lib/auth";
import { api } from "~console/lib/data";
import { getCookie } from "~console/lib/utils";
import { authStore } from "~console/state/auth";

import type { Route } from "./+types/route";

import { UserMenu } from "./sidebar-user";
import { AgentSelect } from "./sidebar-agent";
import { StaticContent } from "./sidebar-static";
import { ErrorView } from "~console/components/ui/ErrorView";
import { Toaster } from "sonner";
import { XCircle } from "lucide-react";


async function authMiddleware() {
  await authService.ensureSignedIn();
}

export const unstable_clientMiddleware = [authMiddleware];


export function extractActiveAgent<T extends { slug: string }>(
  agents: readonly T[] | null,
  slug: string | undefined
): T | undefined {
  if (!slug || !agents) return undefined;
  return agents.find(a => a.slug === slug);
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { data: agents = [] } = await api.agents.get();

  const activeAgent = extractActiveAgent(agents, params.slug);

  if (params.slug && !activeAgent)
    throw new Response(`Agent '${params.slug}' does not exist`, { status: 404, statusText: "Not Found" });

  return { agents };
}

export function useActiveAgent() {
  const loaderData = useRouteLoaderData<typeof clientLoader>("routes/_shell");
  return loaderData ? extractActiveAgent(loaderData.agents, useParams().slug) : undefined;
}

function ShellLayout({ error = false } : { error?: boolean }) { 

  const loaderData = useLoaderData<typeof clientLoader>();

  // Rebuild active agent here so it re-renders on route switch without server roundtrip
  const activeAgent = useActiveAgent();

  const { user } = useSnapshot(authStore);

  // FUTURE replace with session storage
  const defaultOpen = getCookie("sidebar_state") === "true";

  return (
    <div className="flex min-h-dvh flex-col gap-4">
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "12rem",
            "--sidebar-width-mobile": "12rem",
            "--sidebar-width-icon": "4rem",
          } as React.CSSProperties
        }
      >
        <Sidebar collapsible="icon">
          <div className="flex h-full w-full flex-col transition-[padding] group-data-[state=collapsed]:p-2">
            <SidebarHeader>
              <AgentSelect activeAgent={activeAgent} agents={loaderData?.agents!} />
            </SidebarHeader>
            <SidebarContent />
            <SidebarFooter>
                <StaticContent />
                <SidebarSeparator className="mx-0" />
                <UserMenu user={user} />
            </SidebarFooter>
            <SidebarRail />
          </div>
        </Sidebar>

        <main className="relative flex w-full flex-1 flex-col gap-4 p-4">
          <SidebarTrigger className="fixed -m-1.5" />
          <Toaster
            position="top-right"
            icons={{error: <XCircle className="size-4" />}}
          />

          <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-2 py-8">
            {error ? <ErrorView /> : <Outlet />}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}

export default ShellLayout;

export const ErrorBoundary = () => <ShellLayout error={true} />;
