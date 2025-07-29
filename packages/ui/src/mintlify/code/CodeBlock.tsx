"use client";

import { clsx } from "clsx";
import {
  ComponentPropsWithoutRef,
  ForwardedRef,
  forwardRef,
  ReactElement,
} from "react";

import { CopyToClipboardResult } from "../utils/copyToClipboard";
import { getNodeText } from "../utils/getNodeText";
import { CopyToClipboardButton } from "./CopyToClipboardButton";

export interface CodeBlockPropsBase {
  /**
   * The callback function when a user clicks on the copied to clipboard button
   */
  onCopied?: (result: CopyToClipboardResult, textToCopy?: string) => void;
}

export type CodeBlockProps = CodeBlockPropsBase &
  Omit<ComponentPropsWithoutRef<"div">, keyof CodeBlockPropsBase>;

export const CodeBlock = forwardRef(function CodeBlock(
  { onCopied, children, className }: CodeBlockProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const Button = (
    props: Partial<ComponentPropsWithoutRef<typeof CopyToClipboardButton>>,
  ) => (
    <CopyToClipboardButton
      textToCopy={getNodeText(children)}
      onCopied={onCopied}
      {...props}
    />
  );

  return (
    <div
      className={clsx("relative not-prose gray-frame", className)}
      ref={ref}
    >
      {(children as any)?.props?.title ? (
        <CodeTabBar title={(children as any)?.props?.title}>
          <Button className="relative" />
        </CodeTabBar>
      ) : (
        <Button className="absolute top-0 right-0" />
      )}
      <div className="code-in-gray-frame">{children}</div>
    </div>
  );
});

/**
 * Different from CodeGroup because we cannot use Headless UI's Tab component outside a Tab.Group
 * Styling should look the same though.
 */
function CodeTabBar({
  title,
  children,
}: {
  title: string;
  children?: ReactElement;
}) {
  return (
    <div className="flex leading-6 codeblock-tabs space-x-3">
      <div className="flex-none flex items-center">{title}</div>
      {children && (
        <div className="flex-auto flex items-center justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
