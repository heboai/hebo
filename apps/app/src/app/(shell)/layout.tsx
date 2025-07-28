import Link from "next/link";

import { unstable_ViewTransition as ViewTransition } from "react";

import { BookOpen, ExternalLink } from "lucide-react";

import { Logo } from "~/components/ui/Logo";

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

import { AuthProvider } from "~/components/auth/AuthProvider";
import { UserButton } from "~/components/auth/UserButton";

import { getCookie } from "~/lib/utils";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This only works properly for build not for dev
  const defaultOpen = getCookie("sidebar_state") === "true";

  return (
    <div className="min-h-screen flex flex-col gap-4">
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
          <div className="w-full h-full flex flex-col p-2">
            <SidebarHeader>
              <Link href="/">
                <Logo />
              </Link>
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
              <AuthProvider>
                <UserButton />
              </AuthProvider>
            </SidebarFooter>
            <SidebarRail />
          </div>
        </Sidebar>

        <main className="w-full flex flex-1 p-2">
          <SidebarTrigger />

          <div className="max-w-4xl min-w-0 w-full flex flex-col mx-auto md:py-12 gap-4">
            <ViewTransition default="fade-in">
                {children}
            </ViewTransition>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
