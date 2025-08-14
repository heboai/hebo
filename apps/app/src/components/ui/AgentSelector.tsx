"use client";

import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import { Button } from "@hebo/ui/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hebo/ui/components/DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hebo/ui/components/Sidebar";

import { AgentLogo } from "~/components/ui/AgentLogo";
import { Logo } from "~/components/ui/Logo";
import { api, useEdenQuery } from "~/lib/data";
import { agentStore } from "~/stores/agentStore";

export function AgentSelector() {
  // Query agents list
  const { data: agents = [], fetchStatus } = useEdenQuery<any[]>({
    queryKey: ["agents"],
    // @ts-expect-error: API type not ready
    queryFn: () => api.agents.get(),
    staleTime: 600_000, // 10 minutes
  });

  // Redirect to /create-agent if no agent exists yet
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    if (fetchStatus !== "idle") return;

    const target =
      agents.length > 0 ? `/agent/${params.slug}` : "/agent/create";

    if (pathname !== target && pathname == "/") {
      router.replace(target);
    }
  }, [fetchStatus, agents, pathname, params.slug, router]);

  // Update active agent in agentStore
  const agentSnap = useSnapshot(agentStore);
  useEffect(() => {
    if (params.slug) {
      const agent = agents.find((a) => a.slug === params.slug);
      if (agent) {
        agentStore.activeAgent = { slug: agent.slug, name: agent.name };
      }
    }
  }, [params.slug, agents]);

  // Dropdown open or closed
  const [open, setOpen] = useState(false);

  return agents.length > 0 ? (
    /* TODO: Implement Branch Selector */
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="Select agent"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <AgentLogo />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-lg font-medium">
                  {agentSnap.activeAgent?.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 py-1 pl-2 text-sm">
                <div className="text-sidebar-primary-foreground flex aspect-square size-6 items-center justify-center rounded-lg">
                  <AgentLogo size={24} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-base font-medium">
                    {agentSnap.activeAgent?.name}
                  </span>
                </div>
                <Button variant="ghost" asChild onClick={() => setOpen(false)}>
                  <Link href={`/agent/${agentSnap.activeAgent?.slug}/settings`}>
                    <Settings
                      size={16}
                      className="ml-auto "
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {agents.map((agent) => (
              <DropdownMenuItem key={agent.slug} className="gap-2 p-2" asChild>
                <Link href={`/agent/${agent.slug}`}>
                  {agent.name}
                  {agent.slug === agentSnap.activeAgent?.slug && (
                    <Check size={12} className="ml-auto" aria-hidden="true" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/agent/create">
                <Plus className="size-4" aria-hidden="true" />
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
    <Link href="/" aria-label="Home">
      <Logo />
    </Link>
  );
}
