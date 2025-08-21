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
import { Chat } from "@hebo/aikit-ui/src/blocks/Chat";
import { SquareChevronRight } from "lucide-react";
import supportedModels from "@hebo/shared-data/supported-models.json";

async function authMiddleware() {
  await authService.ensureSignedIn();
}

export const unstable_clientMiddleware = [authMiddleware];

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { data: agents } = await api.agents.get();

  const activeAgent = params.slug ? agents!.find((a: any) => a.slug === params.slug) : undefined;

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
            icon={<SquareChevronRight size={24} color="black" />}
            text="Playground"
            className="fixed top-4 right-2 z-50 w-fit"
          />

          <Sidebar side="right" collapsible="offcanvas">
            <SidebarContent>
              <Chat modelsConfig={{
                __supportedTypes: ["llama-3.1-8b-instant"],
                models: [{
                  alias: "Llama3.1-8b Instant",
                  type: "llama-3.1-8b-instant",
                  endpoint: {
                    baseUrl: import.meta.env.VITE_GATEWAY_URL!,
                    apiKey: "",
                    provider: "openai"
                  }
                }]
              }} />
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>
      </div>
    </div>
  );
}