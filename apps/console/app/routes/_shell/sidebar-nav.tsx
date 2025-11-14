import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/shared-ui/components/Sidebar";
import { BrainCog, Home } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { kbs } from "~console/lib/utils";

const navItems = [
  {
    label: "Overview",
    icon: Home,
    getPath: (slug: string) => `/agent/${slug}/branch/main`,
    isActive: (pathname: string, slug: string) => pathname === `/agent/${slug}/branch/main`,
    shortcut: "mod+O",
  },
  {
    label: "Models",
    icon: BrainCog,
    getPath: (slug: string) => `/agent/${slug}/branch/main/models`,
    isActive: (pathname: string, slug: string) => pathname === `/agent/${slug}/branch/main/models`,
    shortcut: "mod+M",
  },
];

type SidebarNavProps = {
  activeAgent?: { slug: string };
};

export const SidebarNav = ({ activeAgent }: SidebarNavProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  navItems.forEach(({ shortcut, getPath }) => {
    useHotkeys(
      shortcut,
      () => {
        if (!activeAgent) return;
        navigate(getPath(activeAgent.slug), { viewTransition: true });
      },
      { preventDefault: true },
      [activeAgent?.slug, navigate],
    );
  });

  return activeAgent ? (
      <SidebarMenu>
        {navItems.map(({ label, icon: Icon, getPath, isActive, shortcut }) => {
          const path = getPath(activeAgent.slug);
          const active = isActive ? isActive(pathname, activeAgent.slug) : pathname === path;

          return (
            <SidebarMenuItem key={label}>
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
                <Link to={path}>
                  <Icon />
                  {label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    ) : (
        <></>
    )
};
