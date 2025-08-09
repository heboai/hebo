"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { api } from "~/lib/data";
import { agentStore } from "~/stores/agentStore";

export function AgentSelector() {
  const [agents, setAgents] = useState();
  const pathname = usePathname();
  const router = useRouter();
  const agentSnap = useSnapshot(agentStore);

  // Redirect to /create-agent if on agent exists yet
  useEffect(() => {
    const cancelled = false;

    (async () => {
      // TODO: Replace this with Eden React Query Client
      // @ts-expect-error: API type not ready
      const { data } = await api.agents.get();
      if (cancelled) return;

      setAgents(data);

      if (data.length === 0) {
        if (pathname != "/agent/create") {
          router.replace("/agent/create");
        }
      } else if (pathname == "/") {
        router.replace("/agent");
      }
    })();
  }, [pathname, router]);

  return (agents ?? []).length > 0 ? (
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
            {(agents ?? []).map((agent, index) => (
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
