import { WebhookError } from "./errors.js";
import {
  WebhookEvents,
  ErrorHandler,
  WebhookPayload,
  WebhookConfig,
  EventPayloadMap,
  WebhookEventConfig,
} from "./types.js";
import { verifySignature } from "./utils.js";

/**
 * A builder and handler for webhooks.
 */
export class Webhook extends EventTarget {
  private readonly eventConfigs: Partial<
    Record<WebhookEvents, WebhookEventConfig>
  >;
  private errorHandler: ErrorHandler = (err: unknown) => {
    throw err;
  };

  public readonly fetch: (request: Request) => Promise<Response>;

  /**
   * Creates a new instance of the Webhook handler.
   * @param config The configuration object containing the event configurations.
   */
  constructor(config: WebhookConfig) {
    super();
    if (!config || !config.events || typeof config.events !== "object") {
      throw new WebhookError(
        "Webhook config with 'events' map must be provided.",
      );
    }
    this.eventConfigs = config.events;

    this.fetch = async (request: Request): Promise<Response> => {
      try {
        await this.process(request);
        return new Response("OK", { status: 200 });
      } catch (error: unknown) {
        if (error instanceof WebhookError) {
          return new Response(error.message, { status: 400 });
        }
        console.error("Webhook processing failed:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    };
  }

  /**
   * Registers a handler for a specific event type.
   * Note: Multiple handlers per event are supported (no implicit overwrite).
   * @param eventType The event type to handle.
   * @param callback The function to execute when this event is received.
   */
  public on<E extends WebhookEvents>(
    eventType: E,
    callback: (payload: EventPayloadMap[E]) => void | Promise<void>,
  ): this {
    this.addEventListener(eventType, (event: Event) => {
      const customEvent = event as CustomEvent<EventPayloadMap[E]>;
      const ret = callback(customEvent.detail);
      // If callback returns a promise, handle rejection via errorHandler
      if (ret && typeof (ret as any).catch === "function") {
        (ret as Promise<void>).catch((error) => {
          // best-effort: do not throw here (would be swallowed); delegate
          this.errorHandler(error);
        });
      }
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
      const body = await request.text();
      const payload: WebhookPayload = JSON.parse(body);
      const signature = request.headers.get("x-webhook-signature");

      const eventType = payload.event_type as WebhookEvents;
      if (
        (Object.values(WebhookEvents) as string[]).includes(eventType) === false
      ) {
        throw new WebhookError(
          "Could not determine event type from request body.",
        );
      }

      if (signature === null) {
        throw new WebhookError("No signature found in request headers.");
      }

      // Look up the event config object from the constructor config
      const eventConfig = this.eventConfigs[eventType];
      if (!eventConfig || !eventConfig.signingKey) {
        throw new WebhookError(
          `No configuration or signingKey found for event type: ${eventType}. Please provide it in the Webhook constructor.`,
        );
      }
      const signingKey = eventConfig.signingKey;
      verifySignature(body, signature, signingKey);

      this.dispatchEvent(new CustomEvent(eventType, { detail: payload }));
    } catch (error: unknown) {
      await this.errorHandler(error);
      throw error;
    }
  }
}

/**
 * Creates a new instance of the Webhook handler.
 * This is a factory function that provides a function-like interface.
 * @param config The configuration object containing the event configurations.
 */
export function createWebhookHandler(config: WebhookConfig): Webhook {
  return new Webhook(config);
}

export * from "./types.js";
export * from "./errors.js";
export * from "./utils.js";
