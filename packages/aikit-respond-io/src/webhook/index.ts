import { RespondIoWebhookError } from "./errors";
import {
  RespondIoEvents,
  EventHandler,
  ErrorHandler,
  WebhookPayload,
  RespondIoWebhookConfig,
  EventPayloadMap,
  WebhookEventConfig,
} from "./types";
import { verifySignature } from "./utils";

/**
 * A builder and handler for respond.io webhooks.
 */
export class RespondIoWebhook extends EventTarget {
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
    super(); // Call the EventTarget constructor
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

    // Use addEventListener internally
    this.addEventListener(eventType, (event: Event) => {
      const customEvent = event as CustomEvent<
        EventPayloadMap[typeof eventType]
      >;
      callback(customEvent.detail);
    });
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
   * @param request The incoming Request object (e.g., from a Fetch API compatible environment).
   */
  public async process(request: Request): Promise<void> {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();
      const headers: Record<string, string> = {};
      for (const [key, value] of clonedRequest.headers.entries()) {
        headers[key.toLowerCase()] = value;
      }

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

      const signature = headers["x-webhook-signature"] as string | undefined;

      verifySignature(body, signature, signingKey); // Use the looked-up key
      console.log(`Received event: ${eventType}`);

      // Dispatch the event using EventTarget's dispatchEvent
      this.dispatchEvent(new CustomEvent(eventType, { detail: payload }));
    } catch (error) {
      await this.errorHandler(error as Error);
      throw error;
    }
  }
}
export * from "./types";
export * from "./errors";
