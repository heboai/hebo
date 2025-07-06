"use client";
import { useState } from "react";
import { AgentDropdown } from "@/components/common/AgentDropDown";
import Link from "next/link";
import { House, BrainCog, KeyRound, Gauge, BookOpen, PanelRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { UserButton } from "@stackframe/stack";
import Image from "next/image";

const navLinks = [
  {
    name: "Overview",
    href: "/overview",
    icon: <House className="w-5 h-5" />,
  },
  {
    name: "Models",
    href: "/models",
    icon: <BrainCog className="w-5 h-5" />,
  },
  {
    name: "API Keys",
    href: "/api-keys",
    icon: <KeyRound className="w-5 h-5" />,
  },
];

export const SideNav = () => {
  // All hooks must be at the top, before any return or conditional
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const envOptions = ["Main", "Prod"];
  const [selectedEnv, setSelectedEnv] = useState(envOptions[0]);
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);

  // Now do early returns
  const authPages = ['/signin', '/signup'];
  const excludedPages = [...authPages, '/new-agent'];
  if (excludedPages.includes(pathname)) {
    return null;
  }

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") handleToggle();
  };

  // Dropdown handlers
  const handleEnvDropdown = () => setEnvDropdownOpen((open) => !open);
  const handleEnvKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") handleEnvDropdown();
  };
  const handleEnvSelect = (env: string) => {
    setSelectedEnv(env);
    setEnvDropdownOpen(false);
  };

  // Toggle button component for reuse
  const ToggleButton = (
    <button
      className="p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center mx-0 my-2"
      aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      type="button"
    >
      <PanelRight className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} />
    </button>
  );

  // Environment dropdown button
  const EnvDropdownButton = (
    <div className="relative w-full flex justify-center items-center mt-2">
      <button
        className={`flex items-center gap-2 px-3 py-2 bg-gray-50 text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition rounded-lg shadow-sm border border-gray-400 hover:bg-gray-200 ${expanded ? "w-36 justify-between" : "w-10 justify-center"}`}
        aria-label="Select environment"
        aria-haspopup="listbox"
        aria-expanded={envDropdownOpen}
        tabIndex={0}
        onClick={handleEnvDropdown}
        onKeyDown={handleEnvKeyDown}
        type="button"
        style={{ borderRadius: 8, maxWidth: 184, height: 36 }}
      >
        <span className={`${expanded ? "flex items-center" : "flex items-center justify-center w-full"}`}>
          {expanded ? selectedEnv : selectedEnv.charAt(0)}
        </span>
        {expanded && (
          <span className="flex items-center gap-1 text-gray-400 text-xs ml-2 justify-end w-full text-right">
            <span className="text-base">⌘</span>E
          </span>
        )}
        <svg className={`w-4 h-4 ml-auto transition-transform ${envDropdownOpen ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {envDropdownOpen && (
        <ul
          className="absolute left-0 z-10 mt-1 w-full bg-white border border-gray-200 rounded-[8px] shadow-lg focus:outline-none"
          role="listbox"
        >
          {envOptions.map((env) => (
            <li
              key={env}
              role="option"
              aria-selected={selectedEnv === env}
              className={`px-4 py-2 cursor-pointer font-semibold hover:bg-blue-100 ${selectedEnv === env ? "bg-blue-50" : ""}`}
              tabIndex={0}
              onClick={() => handleEnvSelect(env)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleEnvSelect(env);
              }}
            >
              {env}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <nav
      className={`flex flex-col h-screen bg-white transition-all duration-200 ${expanded ? "w-56 max-w-[224px]" : "w-18"} px-0 py-4 shadow-none`}
      aria-label="Sidebar"
    >
      {/* Header: layout changes based on expanded state */}
      <div className={`mb-1 ${expanded ? "flex flex-row items-center gap-2 px-3" : "flex flex-col items-center gap-2 px-0"}`}>
        <Image
          src="/hebo-icon.svg"
          alt="Hebo Logo"
          width={32}
          height={32}
          className="mx-0"
        />
        {expanded && <AgentDropdown />}
        {/* Show toggle button inline with AgentDropdown when expanded */}
        {expanded && <div className="ml-auto">{ToggleButton}</div>}
      </div>
      {/* Environment dropdown below header */}
      <div className={`flex flex-col items-center w-full ${expanded ? "px-3" : "px-0"} mb-2`}>{EnvDropdownButton}</div>
      {/* When compressed, show toggle button below logo, above nav links */}
      {!expanded && <div className="flex flex-col items-center mb-2">{ToggleButton}</div>}
      {/* Centered or left-aligned content below logo/toggle depending on expanded state */}
      <div className={`flex flex-col flex-1 w-full ${expanded ? "items-start" : "items-center"}`}>
        <ul className={`flex flex-col gap-2 w-full ${expanded ? "items-start" : "items-center"}`}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name} className={`w-full flex ${expanded ? "justify-start" : "justify-center"}`}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 text-gray-800 transition-colors text-base font-medium w-full ${
                    expanded ? "justify-start" : "justify-center"
                  } ${
                    isActive
                      ? "bg-blue-100"
                      : "hover:bg-gray-100 focus:bg-gray-100"
                  } focus:outline-none`}
                  aria-label={link.name}
                  tabIndex={0}
                >
                  {link.icon}
                  {expanded && <span>{link.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        {/* Bottom section with separator and buttons */}
        <div className={`mt-auto w-full flex flex-col ${expanded ? "items-start" : "items-center"}`}>
          <div className="border-t border-gray-200 my-2 max-w-[184px] w-full mx-auto" aria-hidden="true" />
          <div className={`flex flex-col gap-2 px-1 w-full ${expanded ? "items-start" : "items-center"}`}>
            <Link
              href="/usage"
              className={`w-full flex items-center gap-2 px-3 py-2 text-gray-800 transition-colors text-base font-medium ${
                expanded ? "justify-start" : "justify-center"
              } ${
                pathname === "/usage"
                  ? "bg-blue-100"
                  : "hover:bg-gray-100 focus:bg-gray-100"
              } focus:outline-none`}
              aria-label="Usage"
              tabIndex={0}
            >
              <Gauge className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <>
                  <span>Usage</span>
                  <span className="flex items-center gap-1 text-gray-400 text-xs ml-2 justify-end w-full text-right">
                    <span className="text-base">⌘</span>U
                  </span>
                </>
              )}
            </Link>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 text-gray-800 transition-colors text-base font-medium ${
                expanded ? "justify-start" : "justify-center"
              } ${
                pathname === "/docs"
                  ? "bg-blue-100"
                  : "hover:bg-gray-100 focus:bg-gray-100"
              } focus:outline-none`}
              aria-label="Open documentation"
              tabIndex={0}
              onClick={() => window.open("https://docs.hebo.ai", "_blank", "noopener noreferrer")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") window.open("https://docs.hebo.ai", "_blank", "noopener noreferrer");
              }}
              type="button"
            >
              <BookOpen className="w-5 h-5" />
              {expanded && <span>Documentation</span>}
            </button>
          </div>
          <div className="border-t border-gray-200 my-2 max-w-[184px] w-full mx-auto" aria-hidden="true" />
          <div className="flex flex-col items-center w-full">
          <UserButton showUserInfo={expanded} />
          </div>
        </div>
      </div>
    </nav>
  );
};