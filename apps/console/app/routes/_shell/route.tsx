import { BookOpen, ExternalLink } from "lucide-react";

import { Outlet } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@hebo/ui/components/Sidebar";

import { UserButton } from "~/components/auth/UserButton";
import { AgentSelector } from "~/components/ui/AgentSelector";
import { getCookie } from "~/lib/utils";

import { authService } from "~/lib/auth";

async function authMiddleware() {
  await authService.ensureSignedIn();
}

export const unstable_clientMiddleware = [authMiddleware];

export default function ShellLayout() {
  // This only works properly for build not for dev
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
              <AgentSelector />
            </SidebarHeader>
            <SidebarContent />
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Documentation &#x21D7;">
                    <a
                      href="https://docs.hebo.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpen />
                      Documentation
                    </a>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>
                    <ExternalLink size={12} />
                  </SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator className="mx-0" />
              <UserButton />
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
    </div>
  );
}
