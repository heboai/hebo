import { RespondIoEvents, MessageReceivedPayload } from "../webhook/types";

/**
 * Represents a trigger that can initiate a workflow.
 * This is a private contract between a Trigger factory and the RespondIoApp.
 * It contains the low-level eventType needed for the webhook handler.
 * @template T The type of the payload that this trigger will provide.
 */
export interface Trigger<T> {
  eventType: RespondIoEvents;
}

/**
 * Creates a trigger that fires when any new message is received.
 * This is the public-facing API that consumers of the library will use.
 */
export function messageReceived(): Trigger<MessageReceivedPayload> {
  return {
    eventType: RespondIoEvents.MessageReceived,
  };
}
