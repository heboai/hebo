import { BookOpen, ExternalLink } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@hebo/ui/components/Sidebar";

import { UserMenu } from "./sidebar-user";
import { AgentSelect } from "./sidebar-agent";

export default function SidebarLeft() {
  return (
    <Sidebar collapsible="icon">
        <div className="flex h-full w-full flex-col transition-[padding] group-data-[state=collapsed]:p-2">
        <SidebarHeader>
            <AgentSelect />
        </SidebarHeader>
        <SidebarContent />
        <SidebarFooter>
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentation &#x21D7;">
                <a
                    href="https://docs.hebo.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <BookOpen />
                    Documentation
                </a>
                </SidebarMenuButton>
                <SidebarMenuBadge>
                <ExternalLink size={12} />
                </SidebarMenuBadge>
            </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator className="mx-0" />
            <UserMenu />
        </SidebarFooter>
        <SidebarRail />
        </div>
    </Sidebar>
  );
}
