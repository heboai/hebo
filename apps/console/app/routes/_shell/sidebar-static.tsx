import { BookOpen, ExternalLink } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hebo/shared-ui/components/Sidebar";


export function StaticContent() {
  return (
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
  );
}
