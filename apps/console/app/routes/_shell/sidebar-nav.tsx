import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/shared-ui/components/Sidebar";
import { BrainCog } from "lucide-react";
import { Link } from "react-router";

export function SidebarNav({ activeAgent }: { activeAgent?: { slug: string } }) {
  return (
      <SidebarMenu>
          <SidebarMenuItem>
              {activeAgent ? (
                  <SidebarMenuButton asChild tooltip="Models Config">
                      <Link
                          to={`/agent/${activeAgent.slug}/branch/main/config`}
                          aria-label="Models Config"
                      >
                          <BrainCog />
                          Models
                      </Link>
                  </SidebarMenuButton>
              ) : (
                  <SidebarMenuButton tooltip="Select an agent" disabled aria-disabled>
                      <BrainCog />
                      Models
                  </SidebarMenuButton>
              )}
          </SidebarMenuItem>
      </SidebarMenu>
  )
}