import type { SendTextMessageAction } from "./types";
import type { ContactIdentifier } from "../api/types";

// Overloaded function signatures for the public API
export function sendTextMessage(text: string): SendTextMessageAction;
export function sendTextMessage(params: {
  text: string;
  identifier: ContactIdentifier;
}): SendTextMessageAction;

/**
 * Creates a 'sendTextMessage' action object.
 * This can be called in two ways:
 * 1. With just a string for the message text (for use within a trigger context).
 * 2. With a parameter object including an explicit contact identifier (for use anywhere).
 * @param textOrParams The message text string or a parameter object.
 * @returns A SendTextMessageAction object.
 */
export function sendTextMessage(
  textOrParams: string | { text: string; identifier: ContactIdentifier },
): SendTextMessageAction {
  if (typeof textOrParams === "string") {
    // This is the simple version, create an action without an identifier.
    // The context will be responsible for providing it.
    return {
      type: "sendTextMessage",
      payload: {
        text: textOrParams,
      },
    };
  } else {
    // This is the explicit version, create an action with the identifier.
    return {
      type: "sendTextMessage",
      payload: {
        text: textOrParams.text,
        identifier: textOrParams.identifier,
      },
    };
  }
}
