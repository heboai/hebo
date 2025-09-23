import { Check, GitBranch, ChevronsUpDown, ChevronDown } from "lucide-react";
import { Link } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@hebo/shared-ui/components/DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hebo/shared-ui/components/Sidebar";
import { kbs } from "~console/lib/utils";

type Branch = { name: string; slug: string };
type AgentWithBranches = { slug: string; branches?: Branch[] | undefined };

export const BranchSelect = ({
  activeAgent,
  activeBranch,
}: {
  activeAgent: AgentWithBranches;
  activeBranch?: Branch | null;
}) => {
  const branches = activeAgent.branches ?? [];

  if (branches.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="border-1 bg-white">
            <SidebarMenuButton aria-label="Select branch">
                <GitBranch className="size-4" aria-hidden="true" color="black"/>
                <span className="truncate font-medium">
                  {activeBranch?.name ?? "Select branch"}
                </span>
                
                
                <span className="ml-auto flex items-center justify-end">
  <DropdownMenuShortcut>{kbs("cmd+B")}</DropdownMenuShortcut>
  <ChevronDown className="size-4" aria-hidden="true" />
</span>
              
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-48 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {branches.map((branch) => (
              <DropdownMenuItem key={branch.slug} asChild className="gap-2 p-2">
                <Link
                  to={`/agent/${activeAgent.slug}/branch/${branch.slug}`}
                  aria-label={`Switch to ${branch.name} branch`}
                  viewTransition
                >
                  {branch.name}
                  {branch.slug === activeBranch?.slug && (
                    <Check className="ml-auto size-3.5" aria-hidden="true" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};