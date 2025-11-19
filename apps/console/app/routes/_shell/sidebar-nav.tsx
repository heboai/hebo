import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/shared-ui/components/Sidebar";
import { BrainCog, Home } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { kbs } from "~console/lib/utils";

const navItems = [
  {
    label: "Overview",
    icon: Home,
    getPath: (agentSlug: string, branchSlug: string) => `/agent/${agentSlug}/branch/${branchSlug}`,
    isActive: (pathname: string, agentSlug: string, branchSlug: string) => pathname === `/agent/${agentSlug}/branch/${branchSlug}`,
    shortcut: "mod+O",
  },
  {
    label: "Models",
    icon: BrainCog,
    getPath: (agentSlug: string, branchSlug: string) => `/agent/${agentSlug}/branch/${branchSlug}/models`,
    isActive: (pathname: string, agentSlug: string, branchSlug: string) => pathname === `/agent/${agentSlug}/branch/${branchSlug}/models`,
    shortcut: "mod+M",
  },
];

type SidebarNavProps = {
  activeAgent: { slug: string };
  activeBranch: { slug: string };
};

export const SidebarNav = ({ activeAgent, activeBranch }: SidebarNavProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  navItems.forEach(({ shortcut, getPath }) => {
    useHotkeys(
      shortcut,
      () => {
        navigate(getPath(activeAgent.slug, activeBranch.slug), { viewTransition: true });
      },
      { preventDefault: true },
      [activeAgent.slug, activeBranch.slug, navigate],
    );
  });

  return (
    <SidebarMenu>
      {navItems.map(({ label, icon: Icon, getPath, isActive, shortcut }) => {
        const path = getPath(activeAgent.slug, activeBranch.slug);
        const active = isActive ? isActive(pathname, activeAgent.slug, activeBranch.slug) : pathname === path;

        return (
          <SidebarMenuItem key={label} className="group-data-[state=expanded]:mx-0.5 transition-[margin]">
            <SidebarMenuButton 
              asChild 
              isActive={active}
              tooltip={{
                children: (
                  <span>
                    {label}{" "}
                    <span className="text-muted-foreground">
                      ({kbs(shortcut)})
                    </span>
                  </span>
                )
              }}
              >
              <Link to={path} viewTransition>
                <Icon aria-hidden="true" />
                {label}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};
