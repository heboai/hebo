import { BookOpen, ExternalLink } from "lucide-react";
// eslint-disable-next-line import/named
import { unstable_ViewTransition as ViewTransition } from "react";

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

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <div className="flex h-full w-full flex-col p-2">
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
            <ViewTransition default="fade-in">{children}</ViewTransition>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
