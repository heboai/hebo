"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
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
  const agentSnap = useSnapshot(agentStore);

  // Query agents list
  const { data: agents = [] } = useQuery<any[]>(
    {
      queryKey: ["agents"],
      // @ts-expect-error: API type not ready
      queryFn: () => api.agents.get(),
      staleTime: 600_000, // 10 minutes
    },
    queryClient,
  );

  // Redirect to /create-agent if on agent exists ye
  const lastTarget = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const target = agents.length > 0 ? "/agent" : "/agent/create";

    // only navigate if needed, and don’t repeat the same target
    if (pathname !== target && lastTarget.current !== target) {
      lastTarget.current = target;
      router.replace(target);
    }
  }, [agents, pathname, router]);

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
                  {agentSnap.activeAgent}
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
                onClick={() => (agentStore.activeAgent = agent.agentName)}
              >
                {agent.agentName}
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
