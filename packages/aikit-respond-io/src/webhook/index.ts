import { RespondIoWebhookError } from "./errors";
import {
  RespondIoEvents,
  EventHandler,
  ErrorHandler,
  HandlerConfig,
  WebhookPayload,
  RespondIoWebhookConfig,
  EventPayloadMap,
  WebhookEventConfig,
} from "./types";
import { verifySignature } from "./utils";

/**
 * A builder and handler for respond.io webhooks.
 */
export class RespondIoWebhook {
  private readonly eventHandlers = new Map<string, HandlerConfig>();
  private readonly eventConfigs: Partial<
    Record<RespondIoEvents, WebhookEventConfig>
  >;
  private errorHandler: ErrorHandler = (err) => {
    throw err;
  };

  /**
   * Creates a new instance of the RespondIoWebhook handler.
   * @param config The configuration object containing the event configurations.
   */
  constructor(config: RespondIoWebhookConfig) {
    if (!config || !config.events || typeof config.events !== "object") {
      throw new RespondIoWebhookError(
        "Webhook config with 'events' map must be provided.",
      );
    }
    this.eventConfigs = config.events;
  }

  /**
   * Registers a handler for a specific event type. This will overwrite any existing handler for the same event type.
   * @param eventType The event type to handle.
   * @param callback The function to execute when this event is received.
   */
  public on<E extends RespondIoEvents>(
    eventType: E,
    callback: (payload: EventPayloadMap[E]) => void | Promise<void>,
  ): this;
  public on(eventType: RespondIoEvents, callback: EventHandler): this {
    if (typeof callback !== "function") {
      throw new RespondIoWebhookError(
        `Invalid callback function provided for event "${eventType}".`,
      );
    }

    const handler: HandlerConfig = { callback };
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

      const eventType = payload.event_type as RespondIoEvents;
      if (
        (Object.values(RespondIoEvents) as string[]).includes(eventType) ===
        false
      ) {
        throw new RespondIoWebhookError(
          "Could not determine event type from request body.",
        );
      }

      // Look up the event config object from the constructor config
      const eventConfig = this.eventConfigs[eventType];
      if (!eventConfig || !eventConfig.signingKey) {
        throw new RespondIoWebhookError(
          `No configuration or signingKey found for event type: ${eventType}. Please provide it in the RespondIoWebhook constructor.`,
        );
      }
      const signingKey = eventConfig.signingKey;

      const handler = this.eventHandlers.get(eventType);

      if (!handler) {
        throw new RespondIoWebhookError(
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

      verifySignature(body, signature, signingKey); // Use the looked-up key

      // Execute the handler
      await handler.callback(payload);
    } catch (error) {
      await this.errorHandler(error as Error);
      throw error;
    }
  }
}
export * from "./types";
export * from "./errors";
