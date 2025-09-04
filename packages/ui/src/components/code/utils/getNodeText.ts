// Gets the text from a component as if you selected it with a mouse and copied it.
export const getNodeText = (node): string => {
  if (["string", "number"].includes(typeof node)) {
    // Convert number into string
    return node.toString();
  }

  if (Array.isArray(node)) {
    return node.map((child) => getNodeText(child)).join("");
  }

  if (typeof node === "object" && node?.props?.children) {
    return getNodeText(node.props.children);
  }

  return "";
};
