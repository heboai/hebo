import { XCircle, SquareChevronRight } from "lucide-react";
import { Outlet, useLocation, useRouteLoaderData } from "react-router";
import { Toaster } from "sonner";
import { useSnapshot } from "valtio";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@hebo/shared-ui/components/Sidebar";

import { authService } from "~console/lib/auth";
import { api } from "~console/lib/data";
import { dontRevalidateOnFormErrors } from "~console/lib/errors";
import { getCookie, kbs } from "~console/lib/utils";
import { authStore } from "~console/state/auth";

import { UserMenu } from "./sidebar-user";
import { AgentSelect } from "./sidebar-agent";
import { StaticContent } from "./sidebar-static";
import { PlaygroundSidebar } from "./sidebar-playground";

import type { Route } from "./+types/route";
import { useEffect } from "react";


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
  const { agent: activeAgent = null } = useRouteLoaderData("routes/_shell.agent.$agentSlug") ?? {};

  // FUTURE replace with session storage
  const leftSidebarDefaultOpen = getCookie("left_sidebar_state") === "true";
  const rightSidebarDefaultOpen = getCookie("right_sidebar_state") === "true";

  // Focus main element on route change for keyboard nav
  const location = useLocation();
  useEffect(() => {
    document.getElementById("main-div")?.focus();
  }, [location]);

  return (
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
        <div className="h-full flex flex-col transition-[padding] group-data-[state=collapsed]:p-2">
          <SidebarHeader>
            <AgentSelect agents={agents} activeAgent={activeAgent} />
          </SidebarHeader>
          <SidebarContent />
          <SidebarFooter>
              <StaticContent />
              <SidebarSeparator className="mx-0" />
              <UserMenu user={user} />
          </SidebarFooter>
        </div>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <SidebarTrigger className="fixed m-2" />
        <Toaster
          position="top-right"
          icons={{error: <XCircle className="size-4" aria-hidden="true" />}}
        />
        <div id="main-div" tabIndex={-1} className="min-w-0 flex flex-1 flex-col focus:outline-none gap-4 px-4 sm:px-10 py-12">
          <div className="mx-auto max-w-4xl min-w-0 w-full">
            <Outlet />
          </div>
        </div>
      </SidebarInset>

      <SidebarProvider
        cookieName="right_sidebar_state"
        shortcut="p"
        defaultOpen={rightSidebarDefaultOpen}
        className="contents"
        style={
          {
            "--sidebar-width": "24rem",
            "--sidebar-width-mobile": "24rem", 
            "--sidebar-width-icon": "0rem",
          } as React.CSSProperties
        }
      >
        <SidebarTrigger 
          className="fixed top-3 right-2 w-fit" 
          icon={<div className="flex items-center space-x-1.5">
              <SquareChevronRight size={16} />
              <span>Playground</span>
              <span className="text-muted-foreground">
                {kbs("cmd+P")}
              </span>
            </div>} 
          />
        <Sidebar side="right" collapsible="offcanvas">
          <SidebarContent>
            <PlaygroundSidebar activeBranch={activeAgent?.branches?.[0]} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>

    </SidebarProvider>
  );
}
