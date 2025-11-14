"use client";

import { clsx } from "clsx";
import * as React from "react";

import { CopyToClipboardButton } from "./CopyToClipboardButton";
import { type CopyToClipboardResult } from "./utils/copyToClipboard";
import { getNodeText } from "./utils/getNodeText";

export const styles = {
  frame: "overflow-hidden bg-background border rounded-md shadow-xs not-prose",
  code: "pl-3 py-2 overflow-x-auto",
  header: "flex pl-3 space-x-4 bg-secondary",
};

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
  function Button(
    props: Partial<
      React.ComponentPropsWithoutRef<typeof CopyToClipboardButton>
    >,
  ) {
    return (
      <CopyToClipboardButton
        textToCopy={getNodeText(children)}
        onCopied={onCopied}
        {...props}
      />
    );
  }

  return (
    <div
      className={clsx("relative", styles.frame, className)}
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
      <div className="flex flex-none items-center">{title}</div>
      {children && (
        <div className="flex flex-auto items-center justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
