"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@hebo/ui/shadcn/ui/button";

const extractTextFromNode = (node: any): string => {
  if (["string", "number"].includes(typeof node)) return node.toString();
  if (node instanceof Array) return node.map(extractTextFromNode).join("");
  if (typeof node === "object" && node?.props?.children)
    return extractTextFromNode(node.props.children);
  return "";
};

export function Code({ children }: { children: React.ReactNode }) {

  function CopyButton({ children }: { children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(() => {
      navigator.clipboard.writeText(extractTextFromNode(children)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }, [children]);

    return (
      <Button
      onClick={copy}
      variant="ghost"
      size="icon"
      className="absolute right-0 top-0 bg-background "
      aria-label="Copy"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
    )
  }

  return (
    <pre className="relative w-full overflow-x-auto break-words rounded-lg bg-background text-sm ">

      <CopyButton>${children}</CopyButton>

      <div className="p-2">$ {children}</div>
    </pre>
  );
}
