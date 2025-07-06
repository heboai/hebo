"use client";
import { useState, useRef, useEffect } from "react";
import { SquareChevronRight } from "lucide-react";

export const ChatDrawer = () => {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") handleToggle();
  };

  // Focus input when expanded
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  return (
    <aside
      className={`fixed top-0 right-0 h-screen z-40 transition-all duration-200 flex flex-col items-end ${expanded ? `w-80` : `w-14`} pointer-events-auto`}
      aria-label="Chat drawer"
    >
      {/* Toggle button and Playground label */}
      <div className="absolute top-0 right-0 flex items-center z-50 mt-2">
        <button
          className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
          aria-label={expanded ? "Collapse chat drawer" : "Expand chat drawer"}
          tabIndex={0}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          type="button"
        >
          <SquareChevronRight className="w-5 h-5" />
        </button>
        <span className="ml-2 flex items-center select-none">
          <span className="text-black font-medium">Playground</span>
          <span className="ml-1 text-gray-400 font-mono">⌘P</span>
        </span>
      </div>
      {/* Chat content */}
      {expanded && (
        <div className="flex flex-col h-screen w-80 bg-white shadow-lg border-l border-gray-200">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {/* Chat messages will go here */}
          </div>
          <div className="p-4 border-t border-gray-100">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
              placeholder="Start prompting."
              aria-label="Chat input"
              tabIndex={0}
            />
          </div>
        </div>
      )}
    </aside>
  );
}; 