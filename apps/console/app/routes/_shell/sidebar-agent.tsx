import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { useHotkeys } from 'react-hotkeys-hook'
import { Link, useNavigate } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@hebo/shared-ui/components/DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hebo/shared-ui/components/Sidebar";

import { AgentLogo } from "~console/components/ui/AgentLogo";
import { kbs } from "~console/lib/utils";

type Agent = {
  name: string,
  slug: string,
}

export function AgentSelect({
  activeAgent,
  agents,
}: {
  activeAgent: Agent | undefined,
  agents: Agent[],
}) {

  // Dropdown open / closed
  const [open, setOpen] = useState(false);

  // Keyboard shortcuts
  const navigate = useNavigate();
  useHotkeys("shift+mod+o", () =>
    navigate("/agent/create", { viewTransition: true })
  ), [navigate];

  return (
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
                  {activeAgent?.name ?? "hebo.ai"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <div className="flex items-center justify-between gap-2 py-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-2">
                  <div className="aspect-square size-6 rounded-lg">
                    <AgentLogo size={24} />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-base font-medium">
                      {activeAgent?.name ?? "hebo.ai"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              {activeAgent && (
                <DropdownMenuItem asChild className="p-2 ml-2">
                  <Link
                    to={`/agent/${activeAgent.slug}/settings`}
                    viewTransition
                    aria-label="Agent Settings"
                  >
                    <Settings
                      size={16}
                      className="ml-auto "
                      aria-hidden="true"
                    />
                  </Link>
                </DropdownMenuItem>
              )}
            </div>
            <DropdownMenuSeparator />
            {agents.length > 0 ? (
              agents.map((agent) => (
                <DropdownMenuItem key={agent.slug} className="gap-2 p-2" asChild>
                  <Link to={`/agent/${agent.slug}/branch/main`} viewTransition>
                    {agent.name}
                    {agent.slug === activeAgent?.slug && (
                      <Check size={12} className="ml-auto" aria-hidden="true" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="gap-2 p-2 text-muted-foreground">
                No Agents
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link to="/agent/create" aria-label="Create agent" viewTransition>
                <Plus className="size-4" aria-hidden="true" />
                <div className="text-muted-foreground font-medium">
                  Create Agent
                </div>
                <DropdownMenuShortcut>
                  {kbs("cmd+shift+O")}
                </DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
