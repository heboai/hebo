import crypto from "node:crypto";

import {
  EventHandler,
  ErrorHandler,
  HandlerConfig,
  WebhookPayload,
} from "./webhook/types";

// --- Custom Error Types ---

export class RespondIoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RespondIoError";
  }
}

export class SignatureVerificationError extends RespondIoError {
  constructor(message: string) {
    super(message);
    this.name = "SignatureVerificationError";
  }
}

// --- Type Definitions ---

export enum RespondIoEvents {
  MessageReceived = "message.received",
  MessageSent = "message.sent",
  ContactAssigneeUpdated = "contact.assignee.updated",
  ConversationClosed = "conversation.closed",
}

// --- Internal Verification Logic ---

function verifySignature(
  body: string,
  signature: string | null | undefined,
  signingKey: string,
): void {
  if (!signature) {
    throw new SignatureVerificationError(
      "Missing signature header (x-webhook-signature).",
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", signingKey)
    .update(body)
    .digest("base64");

  if (signature !== expectedSignature) {
    throw new SignatureVerificationError("Signature mismatch.");
  }
}

/**
 * A builder and handler for respond.io webhooks.
 */
export class RespondIoWebhook {
  private readonly eventHandlers = new Map<string, HandlerConfig>();
  private errorHandler: ErrorHandler = (err) => {
    throw err;
  };

  /**
   * Registers a handler for a specific event type. This will overwrite any existing handler for the same event type.
   * @param eventType The event type string.
   * @param signingKey The signing key for this event.
   * @param callback The function to execute when this event is received.
   */
  public on(
    eventType: RespondIoEvents,
    signingKey: string,
    callback: EventHandler,
  ): this {
    if (typeof signingKey !== "string") {
      throw new RespondIoError(
        `Invalid signing key provided for event "${eventType}".`,
      );
    }
    if (typeof callback !== "function") {
      throw new RespondIoError(
        `Invalid callback function provided for event "${eventType}".`,
      );
    }

    const handler: HandlerConfig = { signingKey, callback };
    this.eventHandlers.set(eventType, handler);
    return this;
  }

  /**
   * Registers a global error handler.
   * @param fn The function to execute when an error occurs.
   */
  public onError(fn: ErrorHandler): this {
    this.errorHandler = fn;
    return this;
  }

  /**
   * Processes an incoming webhook request.
   * Verifies the signature and executes the appropriate handler.
   * @param body The raw request body string.
   * @param headers The request headers (case-insensitive).
   */
  public async process(
    body: string,
    headers: Record<string, any>,
  ): Promise<void> {
    try {
      let payload: WebhookPayload;
      try {
        payload = JSON.parse(body);
      } catch {
        throw new Error("Failed to parse request body as JSON.");
      }

      const eventType = payload.event_type;
      // eventType should be in RespondIoEvents
      if (Object.values(RespondIoEvents).includes(eventType) === false) {
        throw new RespondIoError(
          "Could not determine event type from request body.",
        );
      }

      const handler = this.eventHandlers.get(eventType);

      if (!handler) {
        throw new RespondIoError(
          `No handler registered for event type: ${eventType}`,
        );
      }

      // Verify signature for the handler *before* executing
      const normalizedHeaders = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [
          k.toLowerCase(),
          Array.isArray(v) ? v[0] : v,
        ]),
      );
      const signature = normalizedHeaders["x-webhook-signature"] as
        | string
        | undefined;
      verifySignature(body, signature, handler.signingKey);

      // Execute the handler
      await handler.callback(payload);
    } catch (error) {
      await this.errorHandler(error as Error);
    }
  }
}

export {
  type MessageReceivedPayload,
  type MessageSentPayload,
  type ContactAssigneeUpdatedPayload,
  type ConversationClosedPayload,
  type WebhookPayload,
} from "./webhook/types";
