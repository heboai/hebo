import { Check, ChevronDown, GitBranch, Plus } from "lucide-react";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Link } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hebo/shared-ui/components/DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hebo/shared-ui/components/Sidebar";
import { kbs } from "~console/lib/utils";


type Branch = {
  slug: string;
  name?: string;
};

type Agent = {
  slug: string;
  branches?: Branch[];
};

export function BranchSelect({
  activeAgent,
  activeBranch,
}: {
  activeAgent: Agent;
  activeBranch?: Branch;
}) {

  const branches = activeAgent?.branches ?? [];

  // Dropdown open / closed
  const [open, setOpen] = useState(false);
  
  // Keyboard shortcuts
  useHotkeys(
    "mod+J",
    () => {
      setOpen((prev) => !prev);
    },
    { preventDefault: true },
    [activeAgent],
  );

  return (
    <SidebarMenu className="pt-1 pb-2 group-data-[state=expanded]:px-0.5">
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="bg-background border-input border-1" aria-label="Select branch">
              <GitBranch className="size-4" aria-hidden="true" />
              <span className="flex flex-1 truncate">
                  {activeBranch?.name ?? activeBranch?.slug ?? "Select branch"}
              </span>
              <span className="text-muted-foreground">
                  {kbs("mod+J")}
              </span>
              <ChevronDown aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-42 rounded-md"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {branches.length > 0 ? (
              branches.map((branch) => (
                <DropdownMenuItem key={branch.slug}  asChild>
                  <Link
                    to={`/agent/${activeAgent.slug}/branch/${branch.slug}`}
                    viewTransition
                  >
                    {branch.name}
                    {branch.slug === activeBranch?.slug && (
                      <Check size={12} className="ml-auto" aria-hidden="true" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem
                disabled
                className="text-muted-foreground"
              >
                No branches
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground" asChild>
              <Link
                  to={`/agent/${activeAgent.slug}/branches`}
                  viewTransition
                >
                View all branches
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
