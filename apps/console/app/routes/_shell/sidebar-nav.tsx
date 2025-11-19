import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@hebo/shared-ui/components/Sidebar";
import { BrainCog, Home, KeyRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { kbs } from "~console/lib/utils";

const navItems = [
  {
    label: "Overview",
    icon: Home,
    postfix: "",
    shortcut: "mod+O",
  },
  {
    label: "Models",
    icon: BrainCog,
    postfix: "/models",
    shortcut: "mod+M",
  },
  {
    label: "API Keys",
    icon: KeyRound,
    postfix: "/api-keys",
    shortcut: "mod+K",
  },
] as const;

type SidebarNavProps = {
  activeAgent: { slug: string };
  activeBranch: { slug: string };
};

export const SidebarNav = ({ activeAgent, activeBranch }: SidebarNavProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const basePath = `/agent/${activeAgent.slug}/branch/${activeBranch.slug}`;

  navItems.forEach(({ shortcut, postfix }) => {
    useHotkeys(
      shortcut,
      () => {
        navigate(`${basePath}${postfix}`, { viewTransition: true });
      },
      { preventDefault: true },
      [activeAgent.slug, activeBranch.slug, basePath, navigate],
    );
  });

  return (
    <SidebarMenu>
      {navItems.map(({ label, icon: Icon, postfix, shortcut }) => {
        const path = `${basePath}${postfix}`;
        const active = pathname === path;

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
