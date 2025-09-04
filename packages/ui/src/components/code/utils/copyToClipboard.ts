export type CopyToClipboardResult = "success" | "error";

export async function copyToClipboard(
  text: string,
): Promise<CopyToClipboardResult> {
  if (!text) {
    console.warn("Called copyToClipboard() with empty text");
  }

  if (!navigator.clipboard) {
    console.error(
      "The Clipboard API was unavailable. The Clipboard API is only available client-side in browsers using HTTPS.",
    );
    return "error";
  }

  try {
    await navigator.clipboard.writeText(text);
    return "success";
  } catch (error) {
    console.error("Failed to copy:", error);
    return "error";
  }
}
