import { XCircle, SquareChevronRight } from "lucide-react";
import { Outlet, useParams } from "react-router";
import { Toaster } from "sonner";
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
import { dontRevalidateOnFormErrors } from "~console/lib/errors";
import { getCookie } from "~console/lib/utils";
import { kbs } from "~console/lib/utils";
import { authStore } from "~console/state/auth";

import { UserMenu } from "./sidebar-user";
import { AgentSelect } from "./sidebar-agent";
import { StaticContent } from "./sidebar-static";
import { PlaygroundSidebar } from "./sidebar-playground";

import type { Route } from "./+types/route";

async function authMiddleware() {
  await authService.ensureSignedIn();
}

export const unstable_clientMiddleware = [authMiddleware];

export async function clientLoader() {
  return { agents: (await api.agents.get()).data ?? [] };
}

export { dontRevalidateOnFormErrors as shouldRevalidate }

export default function ShellLayout({ loaderData: { agents } }: Route.ComponentProps) { 

  const { user } = useSnapshot(authStore);
  const { agentSlug } = useParams();

  const activeAgent = agents.find(a => a.slug === agentSlug);

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
              <AgentSelect agents={agents} activeAgent={activeAgent} />
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
            icons={{error: <XCircle className="size-4" aria-hidden="true" />}}
          />

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
              <PlaygroundSidebar activeBranch={undefined} />
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>
      </div>
    </div>
  );
}
