import type { MDXComponents } from "mdx/types";

import { CodeBlock } from "@hebo/ui/mintlify/code/CodeBlock";
import { CodeGroup } from "@hebo/ui/mintlify/code/CodeGroup";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    CodeBlock: CodeBlock,
    CodeGroup: CodeGroup,
    ...components,
  };
}
