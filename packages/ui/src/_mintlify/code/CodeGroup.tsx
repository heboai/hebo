"use client";

import { clsx } from "clsx";
import * as React from "react"

import { type CopyToClipboardResult } from "../utils/copyToClipboard";
import { getNodeText } from "../utils/getNodeText";
import { type CodeBlockProps } from "./CodeBlock";
import { CopyToClipboardButton } from "./CopyToClipboardButton";

import * as Tabs from "@radix-ui/react-tabs";

export type CodeGroupPropsBase = {
  /**
   * The callback function when a user clicks on the copied to clipboard button
   */
  onCopied?: (result: CopyToClipboardResult, textToCopy?: string) => void;
  children?: React.ReactElement<CodeBlockProps>[] | React.ReactElement<CodeBlockProps>;
};

export type CodeGroupProps = CodeGroupPropsBase &
  Omit<React.ComponentPropsWithoutRef<"div">, keyof CodeGroupPropsBase>;

/**
 * Group multiple code blocks into a tabbed UI.
 * Uses CodeBlocks as children but does not render them directly. Instead,
 * CodeGroup extracts the props and renders CodeBlock's children.
 *
 * @param {CodeBlock[]} - children
 */
export const CodeGroup = React.forwardRef(function CodeGroup(
  { onCopied, children, className }: CodeGroupProps,
  ref: React.ForwardedRef<HTMLDivElement> | undefined,
) {
  const [activeTab, setActiveTab] = React.useState("0");

  if (children == null) {
    // Hide the frame when no children were passed
    console.warn(
      "CodeGroup has no children, expected at least one CodeBlock child.",
    );
    return null;
  } else if (!Array.isArray(children)) {
    // Allow looping over a single child
    children = [children];
  } else if (children.length === 0) {
    return null;
  }

  const childArr = React.Children.toArray(children) as Array<
    Exclude<React.ReactElement<CodeBlockProps>, boolean | null | undefined>
  >;

  return (
    <Tabs.Root
      ref={ref}
      value={activeTab}
      onValueChange={setActiveTab}
      className={clsx("not-prose gray-frame", className)}
    >
      <Tabs.List className="flex codeblock-header space-x-4">
        {childArr.map((child, tabIndex: number) => (
          <TabItem key={tabIndex.toString()} value={tabIndex.toString()}>
            {(child.props.children as React.ReactElement<{ title?: string }>)?.props?.title ?? "Title Missing"}
          </TabItem>
        ))}
        <div className={clsx("flex-auto flex justify-end")}>
          <CopyToClipboardButton
            textToCopy={getNodeText(
              childArr[parseInt(activeTab)]?.props?.children,
            )}
            onCopied={onCopied}
            className={clsx("relative p-2")}
          />
        </div>
      </Tabs.List>
      {childArr.map((child, tabIndex: number) => (
        <Tabs.Content key={tabIndex.toString()} value={tabIndex.toString()}>
          <pre className="code-in-gray-frame">
              {(child.props.children as React.ReactElement<{ children?: React.ReactNode }>).props.children}
          </pre>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
});

interface TabItemProps {
  children: React.ReactNode;
  value: string;
}

function TabItem({ children, value }: TabItemProps) {
  return (
    <Tabs.Trigger
      className="flex flex-none items-center border-b-2"
      value={value}
    >
      <span className="z-10">{children}</span>
    </Tabs.Trigger>
  );
}
