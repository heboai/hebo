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
import { authService } from "~console/lib/auth";
import { api } from "~console/lib/data";
import { getCookie } from "~console/lib/utils";
import { kbs } from "~console/lib/utils";
import { authStore } from "~console/state/auth";

import type { Route } from "./+types/route";

import { UserMenu } from "./sidebar-user";
import { AgentSelect } from "./sidebar-agent";
import { StaticContent } from "./sidebar-static";
import { PlaygroundSidebar } from "./sidebar-playground";
import { SquareChevronRight } from "lucide-react";

async function authMiddleware() {
  await authService.ensureSignedIn();
}

export const unstable_clientMiddleware = [authMiddleware];

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { data: agents } = await api.agents.get();
  
  // Change from params.slug to params.agentSlug
  const activeAgent = params.agentSlug ? agents!.find((a) => a.slug === params.agentSlug) : undefined;
  
  // Add branch slug identification
  const activeBranch = params.branchSlug && activeAgent 
    ? activeAgent.branches?.find((b) => b.slug === params.branchSlug)
    : undefined;

  if (params.agentSlug && !activeAgent)
    throw new Response("Agent Not Found", { status: 404 });
    
  if (params.branchSlug && !activeBranch)
    throw new Response("Branch Not Found", { status: 404 });

  return { agents, activeAgent, activeBranch };
}

export function shouldRevalidate({ currentParams, nextParams }: ShouldRevalidateFunctionArgs) {
  // Only reload data if the slug exists and changed
  return nextParams.agentSlug !== undefined && currentParams.agentSlug !== nextParams.agentSlug;
}

export default function ShellLayout({loaderData}: Route.ComponentProps) {
  const { user } = useSnapshot(authStore);

  // FUTURE replace with session storage
  const leftSidebarDefaultOpen = getCookie("left_sidebar_state") === "true";
  const rightSidebarDefaultOpen = getCookie("right_sidebar_state") === "true";

  return (
    <div className="flex min-h-dvh gap-4">
      {/* LEFT SIDEBAR */}
      <SidebarProvider
        defaultOpen={leftSidebarDefaultOpen}
        cookieName="left_sidebar_state"
        shortcut="b"
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
                <AgentSelect activeAgent={loaderData?.activeAgent} agents={loaderData?.agents!} />
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
      
      {/* RIGHT SIDEBAR */}
      <div className="top-0 right-0 h-full">
        <SidebarProvider
          cookieName="right_sidebar_state"
          shortcut="p"
          defaultOpen={rightSidebarDefaultOpen}
          style={
            {
              "--sidebar-width": "24rem",
              "--sidebar-width-mobile": "24rem", 
              "--sidebar-width-icon": "0rem",
            } as React.CSSProperties
          }
        >
          {/* Floating trigger */}
          <SidebarTrigger 
              className="fixed top-4 right-2 w-fit" 
              icon={<div className="flex items-center space-x-1">
                  <SquareChevronRight className="size-4" />
                  <span className="m-1">Playground</span>
                  <span className="text-muted-foreground">
                    {kbs("P")}
                  </span>
                </div>} 
              />
          <Sidebar side="right" collapsible="offcanvas">
            <SidebarContent>
              <PlaygroundSidebar activeBranch={loaderData.activeBranch} />
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>
      </div>
    </div>
  );
}
