import { WebhookError, InvalidSignatureError } from "./errors";
import { ErrorHandler, WebhookHandlerOptions, WebhookPayload } from "./types";
import { verifySignature } from "./utils";

const defaultErrorHandler: ErrorHandler = (err: unknown) => {
  console.error("Webhook handler encountered an unhandled error:", err);
};

/**
 * Creates a standard Fetch API-compatible request handler for a specific webhook event.
 * This handler will automatically verify the signature, parse the request body,
 * and execute the provided business logic.
 *
 * @param options Configuration for the webhook handler, including the signing key and event-specific logic.
 * @returns An object that encapsulates the webhook handler functionality.
 */
export function webhook<T extends WebhookPayload>(
  options: WebhookHandlerOptions<T>,
): { fetch: (request: Request) => Promise<Response> } {
  const errorHandler = options.onError || defaultErrorHandler;

  const fetchHandler = async (request: Request): Promise<Response> => {
    try {
      const body = await request.text();
      const signature = request.headers.get("x-webhook-signature");

      if (signature === null) {
        throw new WebhookError("No signature found in request headers.");
      }

      verifySignature(body, signature, options.signingKey);

      const payload: T = JSON.parse(body);

      // Dispatch the user's handler and immediately return 200 OK.
      Promise.resolve(options.handle(payload)).catch((error) => {
        errorHandler(error);
      });

      return new Response("OK", { status: 200 });
    } catch (error: unknown) {
      Promise.resolve(errorHandler(error)).catch((error_) => {
        defaultErrorHandler(error_);
      });

      // Determine the HTTP response status based on the error type.
      if (error instanceof InvalidSignatureError) {
        return new Response(error.message, { status: 400 });
      }

      // return 200 OK to prevent webhook disruption.
      return new Response("OK", { status: 200 });
    }
  };

  return {
    fetch: fetchHandler,
  };
}
export * from "./types";
export * from "./errors";
