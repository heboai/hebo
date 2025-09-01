import type { ContactIdentifier, SendMessageResponse } from "../api/types";

// --- Action Object Definitions ---

/**
 * The underlying object representing a 'sendTextMessage' action.
 * The identifier is optional because the context can provide it if not specified.
 */
export interface SendTextMessageAction {
  type: "sendTextMessage";
  payload: {
    text: string;
    identifier?: ContactIdentifier;
  };
}

// A union of all possible action objects. For now, it's just one.
export type AnyAction = SendTextMessageAction; // | AddTagAction etc.

// --- Action Context Interface ---

/**
 * The context object passed to a trigger's callback.
 * It provides a way to execute actions within the context of the trigger
 * (e.g., automatically applying actions to the contact who sent a message).
 */
export interface ActionContext {
  /**
   * Executes an action within the context of the trigger.
   * If the action supports it and does not have a contact identifier,
   * it will be automatically sent to the contact that triggered the workflow.
   * @param action The action object to execute.
   */
  execute(action: SendTextMessageAction): Promise<SendMessageResponse>;
  // This can be overloaded for other actions in the future
  // execute(action: AddTagAction): Promise<void>;
}
