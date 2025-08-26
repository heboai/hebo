import crypto from "node:crypto";

import { EventPayloadMap } from "./types";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler<T = any> = (payload: T) => void | Promise<void>;
type ErrorHandler = (error: Error) => void | Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface HandlerConfig<T = any> {
  signingKey: string;
  callback: EventHandler<T>;
}

export interface WebhookConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEventType?: (payload: any) => string;
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
 * A builder and handler for respond.io webhooks with a focus on type-safety.
 */
export class RespondIoWebhook {
  private readonly eventHandlers = new Map<string, HandlerConfig>();
  private errorHandler: ErrorHandler = (err) => {
    throw err;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly getEventType: (payload: any) => string;

  constructor(config?: WebhookConfig) {
    this.getEventType =
      config?.getEventType ?? ((payload) => payload?.event_type);
  }

  /**
   * Registers a handler for a specific event type. This will overwrite any existing handler for the same event type.
   * @param eventType The event type (e.g., from `RespondIoEvents`).
   * @param signingKey The signing key for this event.
   * @param callback The function to execute when this event is received.
   */
  public on<E extends keyof EventPayloadMap>(
    eventType: E,
    signingKey: string,
    callback: EventHandler<EventPayloadMap[E]>,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headers: Record<string, any>,
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any;
      try {
        payload = JSON.parse(body);
      } catch {
        throw new Error("Failed to parse request body as JSON.");
      }

      const eventType = this.getEventType(payload);
      if (typeof eventType !== "string") {
        throw new RespondIoError(
          "Could not determine event type from request body.",
        );
      }

      const signature = headers["x-webhook-signature"] as string | undefined;

      const handler = this.eventHandlers.get(eventType);

      if (!handler) {
        throw new RespondIoError(
          `No handler registered for event type: ${eventType}`,
        );
      }

      // Verify signature for the handler *before* executing
      verifySignature(body, signature, handler.signingKey);

      // Execute the handler
      await handler.callback(payload);
    } catch (error) {
      await this.errorHandler(error as Error);
    }
  }
}
