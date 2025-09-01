"use client";

import { clsx } from "clsx";
import { type ComponentPropsWithoutRef, useState } from "react";
import { Copy, Check } from "lucide-react";

import {
  copyToClipboard,
  type CopyToClipboardResult,
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
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <button
      aria-label={"Copy code to clipboard"}
      onClick={async () => {
        const result = await copyToClipboard(textToCopy);
        if (onCopied) {
          onCopied(result, textToCopy);
        }
        if (result === "success") {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, 2000);
        }
      }}
      className={clsx("group bg-inherit", className)}
      {...props}
    >
      {showSuccess ? (
        <Check size={16} className="text-green-600" />
      ) : (
        <Copy size={16} className="text-foreground/60 hover:text-foreground" />
      )}
    </button>
  );
}
