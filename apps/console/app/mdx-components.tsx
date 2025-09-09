import { CodeBlock } from "@hebo/shared-ui/components/code/CodeBlock";
import { CodeGroup } from "@hebo/shared-ui/components/code/CodeGroup";

import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    CodeGroup: CodeGroup,
    ...components,
    wrapper: ({ children }) => <div className="mdx">{children}</div>,
  };
}
