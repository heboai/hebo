import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@hebo/ui/components/Sidebar";

import { AuthProvider } from "~/components/auth/AuthProvider";
import { UserButton } from "~/components/auth/UserButton";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col gap-4">
      <SidebarProvider
        defaultOpen={false}
        className="p-2"
        style={
          {
            "--sidebar-width": "12rem",
            "--sidebar-width-mobile": "12rem",
          } as React.CSSProperties
        }
      >
        <Sidebar collapsible="icon">
          <SidebarHeader />
          <SidebarContent>
            <SidebarGroup />
            <SidebarGroup />
          </SidebarContent>
          <SidebarFooter>
            <AuthProvider>
              <UserButton />
            </AuthProvider>
          </SidebarFooter>
        </Sidebar>
        <main className="w-full flex flex-1">
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
