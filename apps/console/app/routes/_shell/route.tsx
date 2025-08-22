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
import { PlaygroundSidebar } from "./sidebar-playground";
import { SquareChevronRight } from "lucide-react";

async function authMiddleware() {
  await authService.ensureSignedIn();
}

export const unstable_clientMiddleware = [authMiddleware];

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { data: agents } = await api.agents.get();
  
  if (!params.slug) {
    return { agents, activeAgent: undefined, branches: [], activeBranch: undefined };
  }
  
  const activeAgent = agents?.find((a: any) => a.slug === params.slug);
  if (!activeAgent) throw new Response("Agent Not Found", { status: 404 });
  
  const { data: branches = [] } = await api.agents[params.slug].branches.get();
  
  return { 
    agents, 
    activeAgent, 
    branches, 
    activeBranch: branches.find((b: any) => b.slug === "main") || branches[0]
  };
}

export function shouldRevalidate({ currentParams, nextParams }: ShouldRevalidateFunctionArgs) {
  // Only reload data if the slug exists and changed
  return nextParams.slug !== undefined && currentParams.slug !== nextParams.slug;
}

export default function ShellLayout({loaderData}: Route.ComponentProps) {
  const { user } = useSnapshot(authStore);

  // FUTURE replace with session storage
  const leftSidebarDefaultOpen = getCookie("left_sidebar_state") === "true";
  const rightSidebarDefaultOpen = getCookie("right_sidebar_state") === "true";

  return (
    <div className="relative flex min-h-screen">
      {/* LEFT SIDEBAR */}
      <SidebarProvider
        defaultOpen={leftSidebarDefaultOpen}
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
                <AgentSelect activeAgent={loaderData.activeAgent} agents={loaderData.agents!} />
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

          <div className="flex-1 mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-2 p-4 py-8">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
      
      {/* RIGHT SIDEBAR - Positioned absolutely */}
      <div className="absolute top-0 right-0 h-full z-40">
        <SidebarProvider
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
            icon={
              <div className="flex items-center gap-2">
                <SquareChevronRight size={24} color="black" />
                <span>Playground</span>
                <span className="text-muted-foreground">
                  {/Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘P' : 'Ctrl P'}
                </span>
              </div>
            }
            className="fixed top-4 right-2 z-50 w-fit"
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