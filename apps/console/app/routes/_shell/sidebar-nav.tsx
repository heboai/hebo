import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/shared-ui/components/Sidebar";
import { BrainCog } from "lucide-react";
import { Link } from "react-router";

type SidebarNavProps = {
  activeAgent?: { slug: string };
};

export const SidebarNav = ({ activeAgent }: SidebarNavProps) => {
  return (
      <SidebarMenu>
          <SidebarMenuItem>
              {activeAgent && (
                  <SidebarMenuButton asChild tooltip="Models Config">
                      <Link
                          to={`/agent/${activeAgent.slug}/branch/main/models`}
                          aria-label="Models Config"
                      >
                          <BrainCog />
                          Models
                      </Link>
                  </SidebarMenuButton>
              )}
          </SidebarMenuItem>
      </SidebarMenu>
  )
}
