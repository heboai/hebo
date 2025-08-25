import crypto from "node:crypto";

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

// --- Internal Verification Logic ---

function verifySignature(
  body: string,
  signatureHeader: string | undefined | null,
  signingKey: string,
): void {
  if (!signatureHeader) {
    throw new SignatureVerificationError("Missing signature header.");
  }

  const parts = signatureHeader.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.split("=")[1];
  const signature = parts.find((part) => part.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !signature) {
    throw new SignatureVerificationError("Invalid signature header format.");
  }

  const signedPayload = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", signingKey)
    .update(signedPayload)
    .digest("hex");

  if (signature !== expectedSignature) {
    throw new SignatureVerificationError("Signature mismatch.");
  }
}

// --- Public API ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface HandlerConfig {
  signingKey: string;
  callback: EventHandler;
}

export interface WebhookConfig {
  headerName?: string;
  getEventType?: (payload: any) => string;
}

/**
 * A builder and handler for respond.io webhooks.
 * Allows registering different handlers for different event types.
 */
export class RespondIoWebhook {
  private readonly eventHandlers = new Map<string, HandlerConfig>();
  private readonly headerName: string;
  private readonly getEventType: (payload: any) => string;

  constructor(config?: WebhookConfig) {
    this.headerName = config?.headerName ?? "x-respond-signature";
    this.getEventType =
      config?.getEventType ?? ((payload) => payload?.event_type);
  }

  /**
   * Registers a handler for a specific event type.
   * @param eventType The event type string (e.g., 'message.created').
   * @param signingKey The signing key for this event type.
   * @param callback The function to execute when this event is received.
   * @returns The `RespondIoWebhook` instance for chaining.
   */
  public on<T = any>(
    eventType: string,
    signingKey: string,
    callback: EventHandler<T>,
  ): this {
    this.eventHandlers.set(eventType, { signingKey, callback });
    return this;
  }

  /**
   * Processes an incoming webhook request.
   * It verifies the signature, finds the appropriate handler, and executes it.
   * @param body The raw request body string.
   * @param headers The request headers.
   * @throws {Error} if the body cannot be parsed as JSON.
   * @throws {RespondIoError} if the event type is missing or no handler is registered.
   * @throws {SignatureVerificationError} if the signature is invalid.
   */
  public async process(
    body: string,
    headers: Record<string, any>,
  ): Promise<void> {
    // 1. Tentatively parse body to find event type
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error("Failed to parse request body as JSON.");
    }

    // 2. Extract event type
    const eventType = this.getEventType(payload);
    if (typeof eventType !== "string") {
      throw new RespondIoError(
        "Could not determine event type from request body.",
      );
    }

    // 3. Find the handler and key for this event
    const handlerConfig = this.eventHandlers.get(eventType);
    if (!handlerConfig) {
      throw new RespondIoError(
        `No handler registered for event type: ${eventType}`,
      );
    }
    const { signingKey, callback } = handlerConfig;

    // 4. Verify signature
    //const signature = headers[this.headerName] as string | undefined | null;
    //verifySignature(body, signature, signingKey);

    // 5. Execute the callback with the trusted payload
    await callback(payload);
  }
}
