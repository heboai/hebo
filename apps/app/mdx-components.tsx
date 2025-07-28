import type { MDXComponents } from "mdx/types";
import { Code } from "@hebo/ui/components/Code";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: (props: any) => <Code {...props} />,
    ...components
  }
}
