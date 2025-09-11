import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/shared-ui/components/Sidebar";
import { BrainCog } from "lucide-react";
import { Link } from "react-router";

export function SidebarNav({ activeAgent }: { activeAgent?: { slug: string } }) {
    return (
        <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Models Config">
              <Link
                  to={`/agent/${activeAgent?.slug}/branch/main/config`}
                  aria-label="Models Config"
                  rel="noopener noreferrer"
              >
                <BrainCog />
                Models
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
    )
}