import type { MDXComponents } from "mdx/types";

import { CodeBlock } from "@hebo/ui/_mintlify/code/CodeBlock";
import { CodeGroup } from "@hebo/ui/_mintlify/code/CodeGroup";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    CodeGroup: CodeGroup,
    ...components,
  };
}
