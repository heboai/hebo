export function getCookie(name: string): string | undefined {
  if (typeof document !== "undefined") {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return value?.split("=")[1];
  }
}

/**
 * Returns the appropriate keyboard shortcut text based on the user's platform
 * @param shortcut - The shortcut key (e.g., 'P' for the P key)
 * @returns The formatted shortcut string (e.g., '⌘P' on Mac, 'Ctrl P' on other platforms)
 */
export const kbs = (shortcut: string): string => {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

  const map: Record<string, string> = isMac
    ? { cmd: "⌘", option: "⌥", ctrl: "⌃", shift: "⇧" }
    : { cmd: "Ctrl", option: "Alt", ctrl: "Ctrl", shift: "Shift" };

  return shortcut
    .replaceAll('+', "")
    .replaceAll(/(cmd|option|ctrl|shift)/gi, (match) => {
      const lower = match.toLowerCase();
      return map[lower] ?? match.toUpperCase();
    });
};
