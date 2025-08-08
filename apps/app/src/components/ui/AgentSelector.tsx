"use client";

import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSnapshot } from "valtio";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@hebo/ui/components/DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hebo/ui/components/Sidebar";

import { Logo } from "~/components/ui/Logo";
import { agentStore } from "~/stores/agentStore";

export function AgentSelector() {
  const agentSnap = useSnapshot(agentStore);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // TODO: Query Agents
    if (agentSnap.agents.length === 0 && pathname !== "/create-agent") {
      router.push("/create-agent");
    }
  }, [agentSnap.agents.length, pathname, router]);

  return agentSnap.agents.length > 0 ? (
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
                  {agentSnap.agents[0]}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  ) : (
    <Link href="/">
      <Logo />
    </Link>
  );
}
