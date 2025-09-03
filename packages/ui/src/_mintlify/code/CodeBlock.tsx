"use client";

import { clsx } from "clsx";
import * as React from "react"

import { type CopyToClipboardResult } from "../utils/copyToClipboard";
import { getNodeText } from "../utils/getNodeText";
import { CopyToClipboardButton } from "./CopyToClipboardButton";

export const styles = {
  frame: "rounded-md overflow-hidden bg-background border shadow-xs",
  code: "pl-3 py-2 overflow-x-auto",
  header: "bg-slate-200 pl-3 flex space-x-4"
}

export interface CodeBlockPropsBase {
  title: string;
  /**
   * The callback function when a user clicks on the copied to clipboard button
   */
  onCopied?: (result: CopyToClipboardResult, textToCopy?: string) => void;
}

export type CodeBlockProps = CodeBlockPropsBase &
  Omit<React.ComponentPropsWithoutRef<"div">, keyof CodeBlockPropsBase>;

export const CodeBlock = React.forwardRef(function CodeBlock(
  { title, onCopied, children, className, ...props }: CodeBlockProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const Button = (
    props: Partial<React.ComponentPropsWithoutRef<typeof CopyToClipboardButton>>,
  ) => (
    <CopyToClipboardButton
      textToCopy={getNodeText(children)}
      onCopied={onCopied}
      className={className}
      {...props}
    />
  );

  return (
    <div
      className={clsx("relative not-prose", styles.frame, className)}
      role="region"
      aria-label={`Code block: ${title}`}
      ref={ref}
      {...props}
    >
      {title ? (
        <CodeTitleBar title={title}>
          <Button className="relative p-2" />
        </CodeTitleBar>
      ) : (
        <Button className="absolute top-0 right-0 p-2" />
      )}
      <pre className={styles.code}>{children}</pre>
    </div>
  );
});

/**
 * Different from CodeGroup because we cannot use Headless UI's Tab component outside a Tab.Group
 * Styling should look the same though.
 */
function CodeTitleBar({
  title,
  children,
}: {
  title: string;
  children?: React.ReactElement;
}) {
  return (
    <div className={styles.header}>
      <div className="flex-none flex items-center">{title}</div>
      {children && (
        <div className="flex-auto flex items-center justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
