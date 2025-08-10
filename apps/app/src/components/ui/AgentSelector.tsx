"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSnapshot } from "valtio";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hebo/ui/components/DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hebo/ui/components/Sidebar";

import { Logo } from "~/components/ui/Logo";
import { api, queryClient } from "~/lib/data";
import { agentStore } from "~/stores/agentStore";

export function AgentSelector() {
  // Query agents list
  const { data: agents = [], fetchStatus } = useQuery<any[]>(
    {
      queryKey: ["agents"],
      // @ts-expect-error: API type not ready
      queryFn: () => api.agents.get(),
      staleTime: 600_000, // 10 minutes
    },
    queryClient,
  );

  // Redirect to /create-agent if no agent exists yet
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (fetchStatus !== "idle" || pathname === "/agent/create") return;

    const target = agents.length > 0 ? `/agent/${params.id}` : "/agent/create";

    if (pathname !== target) {
      router.replace(target);
    }
  }, [fetchStatus, agents, pathname, router]);

  // Update active agent in agentStore
  const agentSnap = useSnapshot(agentStore);
  useEffect(() => {
    if (params.id) {
      const agent = agents.find((a) => a.id === params.id);
      if (agent) {
        agentStore.activeAgent = { id: agent.id, name: agent.agentName };
      }
    }
  }, [params.id, agents]);

  return agents.length > 0 ? (
    /* TODO: Implement Agent & Branch Dropdowns */
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Image
                  src="/hebo-icon.png"
                  alt="Agent Logo"
                  width={32}
                  height={32}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-lg font-medium">
                  {agentSnap.activeAgent?.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {agents.map((agent) => (
              <DropdownMenuItem
                key={agent.agentName}
                className="gap-2 p-2"
                asChild
              >
                <Link href={`/agent/${agent.id}`}>{agent.agentName}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/agent/create">
                <Plus className="size-4" />
                <div className="text-muted-foreground font-medium">
                  Create agent
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  ) : (
    <Link href="/">
      <Logo />
    </Link>
  );
}
