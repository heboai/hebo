import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/ui/components/Sidebar";
import { BrainCog } from "lucide-react";
import { Link } from "react-router";

export function SidebarConfig({ activeAgent, activeBranch }: { activeAgent: any, activeBranch: any }) {
    return (
        <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Models Config">
              <Link
                  to={`/agent/${activeAgent?.slug}/branch/${activeBranch?.slug}/config`
                  }
                  aria-label="Models Config"
                  rel="noopener noreferrer"
                  viewTransition
              >
                <div className="items-center justify-center mr-2">
                  <BrainCog />
                </div>
                <span>Models</span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
    )
}