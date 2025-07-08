"use client";
import { SquareChevronRight } from "lucide-react";

interface ChatDrawerToggleProps {
  expanded: boolean;
  onToggle: () => void;
}

export const ChatDrawerToggle = ({ expanded, onToggle }: ChatDrawerToggleProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") onToggle();
  };

  return (
    <button
      className="absolute top-0 right-0 flex items-center z-50 mt-2 mr-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      aria-label={expanded ? "Collapse chat drawer" : "Expand chat drawer"}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      type="button"
    >
      <SquareChevronRight 
        className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} 
      />
      <span className="ml-2 flex items-center select-none">
        <span className="text-black font-medium">Playground</span>
        <span className="ml-1 text-gray-400 font-mono">⌘P</span>
      </span>
    </button>
  );
}; 