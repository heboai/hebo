import { Outlet, type ShouldRevalidateFunctionArgs } from "react-router";
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

import { authService } from "~/lib/auth";
import { api } from "~/lib/data";
import { getCookie } from "~/lib/utils";
import { authStore } from "~/state/auth";

import type { Route } from "./+types/route";

import { UserMenu } from "./sidebar-user";
import { AgentSelect } from "./sidebar-agent";
import { StaticContent } from "./sidebar-static";
import Chat from "@hebo/aikit-ui/src/blocks/Chat";
import { SquareChevronRight } from "lucide-react";


async function authMiddleware() {
  await authService.ensureSignedIn();
}

export const unstable_clientMiddleware = [authMiddleware];


export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { data: agents } = await api.agents.get();

  const activeAgent = params.slug ? agents.find((a) => a.slug === params.slug) : undefined;

  if (params.slug && !activeAgent)
    throw new Response("Agent Not Found", { status: 404 });

  return { agents, activeAgent };
}

export function shouldRevalidate({ currentParams, nextParams }: ShouldRevalidateFunctionArgs) {
  // Only reload data if the slug exists and changed
  return nextParams.slug !== undefined && currentParams.slug !== nextParams.slug;
}


export default function ShellLayout({loaderData}: Route.ComponentProps) {
  const { user } = useSnapshot(authStore);

  // FUTURE replace with session storage
  const defaultOpen = getCookie("sidebar_state") === "true";

  return (
    <div className="flex min-h-screen flex-col gap-4">
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
                <AgentSelect activeAgent={loaderData.activeAgent} agents={loaderData.agents} />
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

          <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-2 py-8">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
      {/* RIGHT SIDEBAR / PLAYGROUND */}
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "24rem", // Tailwind w-96
            "--sidebar-width-mobile": "24rem",
            "--sidebar-width-icon": "0rem", // No icon state, fully collapse
          } as React.CSSProperties
        }
      >
        {/* Floating trigger */}
        <SidebarTrigger
          icon={<SquareChevronRight size={24} color="black" />}
          text="Playground"
          className="fixed top-4 right-12 z-50 p-2"
        />

        <Sidebar side="right" collapsible="offcanvas">
          <SidebarContent>
            <Chat />
          </SidebarContent>

          <SidebarRail />
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
