"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./dumb/button";
import { toast } from "sonner";

interface CodeSnippetProps {
  c: string;
}

const CodeSnippetComponent = ({ c }: CodeSnippetProps) => {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(() => {
    navigator.clipboard.writeText(c).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  }, [c]);

  return (
    <div className="flex w-full max-w-[310px] md:max-w-[550px] h-[40px] md:h-[45px] items-center justify-between
                    rounded-lg bg-[#241050] px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-mono
                    text-white shadow-sm">
      <span className="select-text">&gt; {c}</span>
      <Button
        onClick={copy}
        variant="ghost"
        size="icon"
        className="text-white hover:text-white/80 hover:bg-indigo-800/60"
        aria-label="Copy command"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export const CodeSnippet = CodeSnippetComponent;
