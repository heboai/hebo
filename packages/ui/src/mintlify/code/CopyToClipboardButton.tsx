"use client";

import { clsx } from "clsx";
import { ComponentPropsWithoutRef, useState } from "react";
import { Copy, Check } from "lucide-react";

import {
  copyToClipboard,
  CopyToClipboardResult,
} from "../utils/copyToClipboard";

export function CopyToClipboardButton({
  textToCopy,
  onCopied,
  className,
  ...props
}: {
  textToCopy: string;
  onCopied?: (result: CopyToClipboardResult, textToCopy?: string) => void;
} & ComponentPropsWithoutRef<"button">) {
  const [hidden, setHidden] = useState(true);

  return (
    <button
      aria-label={"Copy code to clipboard"}
      onClick={async () => {
        const result = await copyToClipboard(textToCopy);
        if (onCopied) {
          onCopied(result, textToCopy);
        }
        if (result === "success") {
          setHidden(false);
          setTimeout(() => {
            setHidden(true);
          }, 2000);
        }
      }}
      className={clsx("group bg-inherit p-2 ", className)}
      {...props}
    >
      {!hidden ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-foreground/60 hover:text-foreground" />
      )}
    </button>
  );
}
