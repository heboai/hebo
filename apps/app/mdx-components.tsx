
import { CodeBlock } from "@hebo/shared-ui/_mintlify/code/CodeBlock";
import { CodeGroup } from "@hebo/shared-ui/_mintlify/code/CodeGroup";

import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    CodeGroup: CodeGroup,
    ...components,
  };
}
