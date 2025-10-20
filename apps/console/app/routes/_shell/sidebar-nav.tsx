import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/shared-ui/components/Sidebar";
import { BrainCog, Home } from "lucide-react";
import { Link } from "react-router";

type SidebarNavProps = {
  activeAgent?: { slug: string };
};

export const SidebarNav = ({ activeAgent }: SidebarNavProps) => {
  return activeAgent ? (
      <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Overview">
                <Link to={`/agent/${activeAgent.slug}/branch/main`} >
                    <Home />
                    Overview
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Models">
                <Link to={`/agent/${activeAgent.slug}/branch/main/models`} >
                    <BrainCog />
                    Models
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    ) : (
        <></>
    )
};
