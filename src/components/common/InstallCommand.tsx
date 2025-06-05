"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InstallCommandProps {
  cmd?: string; // default shown below
}

export function InstallCommand({ cmd = "npm install -g hebo-eval@latest" }: InstallCommandProps) {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(() => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 1000);
    });
  }, [cmd]);

  return (
    <div className="flex w-full max-w-[310px] md:max-w-[550px] h-[40px] md:h-[45px] items-center justify-between
                    rounded-lg bg-[#241050] px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-mono
                    text-white shadow-sm">
      <span className="select-text">&gt; {cmd}</span>
      <Button
        onClick={copy}
        variant="ghost"
        size="icon"
        className="text-white hover:bg-indigo-800/60"
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
}
