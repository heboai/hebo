import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

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

import { AgentLogo } from "~console/components/ui/AgentLogo";

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

  // Dropdown open or closed
  const [open, setOpen] = useState(false);

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
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 py-1 pl-2 text-sm">
                <div className="text-sidebar-primary-foreground flex aspect-square size-6 items-center justify-center rounded-lg">
                  <AgentLogo size={24} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-base font-medium">
                    {activeAgent?.name ?? "hebo.ai"}
                  </span>
                </div>
                {activeAgent && (
                  <Button
                    variant="ghost"
                    asChild
                    onClick={() => setOpen(false)}
                    aria-label="Agent Settings"
                  >
                    <Link
                      to={`/agent/${activeAgent.slug}/settings`}
                      viewTransition
                    >
                      <Settings
                        size={16}
                        className="ml-auto "
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
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
                No agents
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link to="/agent/create" aria-label="Create agent" viewTransition>
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
  )
}
