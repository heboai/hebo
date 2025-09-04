import { CodeBlock } from "@hebo/ui/components/code/CodeBlock";
import { CodeGroup } from "@hebo/ui/components/code/CodeGroup";

import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    CodeGroup: CodeGroup,
    ...components,
    wrapper: ({ children }) => <div className="mdx">{children}</div>,
  };
}
