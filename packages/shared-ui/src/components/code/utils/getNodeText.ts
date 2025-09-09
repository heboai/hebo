import { type ReactElement, type ReactNode, isValidElement } from "react";

// Gets the text from a component as if you selected it with a mouse and copied it.
export const getNodeText = (node: ReactNode): string => {
  if (["string", "number"].includes(typeof node)) {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getNodeText(child)).join("");
  }

  if (isValidElement(node)) {
    return getNodeText(
      (node as ReactElement<{ children?: ReactNode }>).props.children,
    );
  }

  return "";
};
