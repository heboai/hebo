"use client";

import { useState, useRef, useEffect } from "react";

type Agent = {
  name: string;
};

const agents: Agent[] = [
  { name: "Gato" },
];

export const AgentDropdown = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedAgent = agents[0];

  const handleToggle = () => setOpen((prev) => !prev);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") handleToggle();
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        className="flex items-center gap-2 px-2 py-1 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select team agent"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="font-medium text-base">{selectedAgent.name}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {/* Dropdown menu for future expansion */}
      {open && (
        <ul className="absolute left-0 mt-2 w-32 bg-white shadow-lg rounded-md z-10 py-1" role="listbox">
          <li className="px-4 py-2 text-gray-700 cursor-default" role="option" aria-selected="true">
            {selectedAgent.name}
          </li>
        </ul>
      )}
    </div>
  );
}; 