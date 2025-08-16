import { CodeBlock } from "@hebo/ui/_mintlify/code/CodeBlock";
import { CodeGroup } from "@hebo/ui/_mintlify/code/CodeGroup";

import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // TODO fix CodeBlock in CodeGroup double rendering
    pre: CodeBlock,
    CodeGroup: CodeGroup,
    ...components,
    wrapper: ({ children }) => <div className="mdx">{children}</div>,
  };
}
