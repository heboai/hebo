"use client";

import { CodeSnippet } from "@hebo/ui";

interface CodeSnippetWrapperProps {
  c: string;
}

export function CodeSnippetWrapper({ c }: CodeSnippetWrapperProps) {
  return <CodeSnippet c={c} />;
} 