# aikit-respond

A library to help setup webhook for respond.io integration using a clean, event-based builder.

## Installation

```bash
npm install @hebo/aikit-respond
```

## Usage

This library provides a `RespondIoWebhook` class that allows you to register a handler for different webhook event types. It automatically handles signature verification.

### Example with Express

**Important**: You must use a middleware that provides the raw request body for signature verification. Do not use a middleware that parses the JSON body beforehand.

```ts
import express from "express";
import { RespondIoWebhook, RespondIoEvents } from "@hebo/aikit-respond";

const app = express();

// 1. Create and configure the webhook handler instance.
const webhook = new RespondIoWebhook();

// 2. Register handlers for each event type.
webhook.on(
  RespondIoEvents.MessageReceived,
  process.env.RESPOND_IO_SIGNING_KEY!,
  (payload) => {
    // This callback is only executed for 'message.received' events
    // after the signature has been successfully verified.
    // The `payload` is of type `any`.
    console.log("Got a new message:", payload.message.message.text);
    // Add your business logic here (e.g., save to database, send a reply).
  },
);

webhook.on(
  RespondIoEvents.ConversationClosed,
  process.env.RESPOND_IO_SIGNING_KEY!,
  (payload) => {
    console.log(`Conversation ${payload.conversation.summary} was closed.`);
    // Add your business logic here.
  },
);

// 3. (Optional) Register a global error handler.
webhook.onError((error) => {
  console.error("[Respond.io Webhook Error]", error.message);
});

// 4. Create the route handler.
app.post(
  "/webhook/respond-io",
  // Use express.raw to get the raw body
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // 5. Pass the request to the handler.
      //    It will automatically verify the signature and call the correct callback.
      await webhook.process(req.body.toString(), req.headers);
      res.status(200).send("OK");
    } catch (error) {
      // Errors from the webhook handler are caught here if not handled by `onError`
      // or if `onError` re-throws them.
      res.status(400).send((error as Error).message);
    }
  },
);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

### Example with Hono

With Hono, you can get the raw body text using `c.req.text()` and the headers using `c.req.header()`.

````ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { RespondIoWebhook, RespondIoEvents } from "@hebo/aikit-respond";

const app = new Hono();

// 1. Create and configure the webhook handler instance.
const webhook = new RespondIoWebhook();

// 2. Register handlers for each event type.
webhook.on(
  RespondIoEvents.MessageReceived,
  process.env.RESPOND_IO_SIGNING_KEY!,
  (payload) => {
    console.log("Got a new message:", payload.message.message.text);
  },
);

// 3. (Optional) Register a global error handler.
webhook.onError((error) => {
  console.error("[Respond.io Webhook Error]", error.message);
});

// 4. Create the route handler.
app.post("/webhook/respond-io", async (c) => {
  try {
    // In Hono, you must await the raw body text
    const body = await c.req.text();
    const headers = c.req.header();

    // 5. Pass the request to the handler.
    await webhook.process(body, headers);
    return c.text("OK", 200);
  } catch (error) {
    // Errors from the webhook handler are caught here if not handled by `onError`
    // or if `onError` re-throws them.
    return c.text((error as Error).message, 400);
  }
});

serve(app, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});

### Example with AWS Lambda (API Gateway)

When using AWS Lambda with API Gateway, the raw request body is available in `event.body` and headers in `event.headers`.

```ts
import { RespondIoWebhook, RespondIoEvents } from "@hebo/aikit-respond";

// 1. Create and configure the webhook handler instance.
const webhook = new RespondIoWebhook();

// 2. Register handlers for each event type.
webhook.on(
  RespondIoEvents.MessageReceived,
  process.env.RESPOND_IO_SIGNING_KEY!,
  (payload) => {
    console.log("Got a new message:", payload.message.message.text);
    // Add your business logic here.
  },
);

// 3. (Optional) Register a global error handler.
webhook.onError((error) => {
  console.error("[Respond.io Webhook Error]", error.message);
});

// 4. Export the Lambda handler function.
export const handler = async (event: { body: string; headers: Record<string, string> }) => {
  try {
    // 5. Pass the raw body and headers to the handler.
    await webhook.process(event.body, event.headers);
    return {
      statusCode: 200,
      body: JSON.stringify("OK"),
    };
  } catch (error) {
    // Errors from the webhook handler are caught here if not handled by `onError`
    // or if `onError` re-throws them.
    console.error("[Respond.io Webhook Error]", error.message);
    return {
      statusCode: 400,
      body: JSON.stringify((error as Error).message),
    };
  }
};

### Example with AWS Lambda (SQS Trigger)

If your Lambda function is triggered by an SQS queue, the original webhook body and headers must be embedded within the SQS message. The `process` method requires these for signature verification.

```ts
import { RespondIoWebhook, RespondIoEvents } from "@hebo/aikit-respond";

// 1. Create and configure the webhook handler instance.
const webhook = new RespondIoWebhook();

// 2. Register handlers for each event type.
webhook.on(
  RespondIoEvents.MessageReceived,
  process.env.RESPOND_IO_SIGNING_KEY!,
  (payload) => {
    console.log("Got a new message:", payload.message.message.text);
    // Add your business logic here.
  },
);

// 3. (Optional) Register a global error handler.
webhook.onError((error) => {
  console.error("[Respond.io Webhook Error]", error.message);
});

// 4. Export the Lambda handler function.
//    Assuming the SQS message body contains a JSON string like:
//    { "rawBody": "...", "headers": { "x-webhook-signature": "..." } }
export const handler = async (event: { Records: Array<{ body: string; messageId: string }> }) => {
  for (const record of event.Records) {
    try {
      // Parse the SQS message body to get the original webhook data
      const sqsMessage = JSON.parse(record.body);
      const originalRawBody = sqsMessage.rawBody;
      const originalHeaders = sqsMessage.headers;

      if (!originalRawBody || !originalHeaders) {
        throw new Error("SQS message body missing 'rawBody' or 'headers' properties.");
      }

      // 5. Pass the original raw body and headers to the handler.
      await webhook.process(originalRawBody, originalHeaders);
      console.log("Webhook processed successfully for SQS message:", record.messageId);
    } catch (error) {
      // Errors from the webhook handler are caught here if not handled by `onError`
      // or if `onError` re-throws them.
      console.error("[Respond.io Webhook Error] processing SQS record:", record.messageId, error.message);
      // Depending on your Dead-Letter Queue (DLQ) configuration, you might re-throw here
      // to indicate that the message processing failed for this record.
      // throw error;
    }
  }
};
````

```

## API

### `new RespondIoWebhook(config?)`

Creates a new webhook handler instance.

- `config` (`WebhookConfig`, optional):
  - `getEventType` (`(payload: any) => string`, optional): A function to extract the event type from the parsed body. Defaults to `(payload) => payload.event_type`.

### `.on(eventType, signingKey, callback)`

Registers a handler for a specific event type. This will overwrite any existing handler for the same event.

- `eventType` (`RespondIoEvents`): The event type enum.
- `signingKey` (`string`): The signing key for this specific event type.
- `callback` (`(payload: any) => void | Promise<void>`): The function to execute when a verified event is received. The `payload` argument is of type `any`.
- **Returns**: The `RespondIoWebhook` instance for chaining.

### `.onError(callback)`

Registers a global error handler. If an error occurs during processing, it will be passed to this function. If no `onError` handler is set, errors will be thrown from the `.process()` method.

- `callback` (`(error: Error) => void | Promise<void>`): The function to execute when an error occurs.
- **Returns**: The `RespondIoWebhook` instance for chaining.

### `.process(body, headers)`

Processes an incoming webhook request.

- `body` (`string`): The raw request body string.
- `headers` (`Record<string, any>`): The request headers.
- **Returns**: A promise that resolves when the appropriate handler has been executed.
- **Throws**: `SignatureVerificationError`, `RespondIoError`, or `Error` if no `onError` handler is registered.

## Errors

The library can throw the following errors from the `.process()` method if they are not handled by an `onError` callback:

- `RespondIoError`: A generic error, e.g., if no handler is registered for an event.
- `SignatureVerificationError`: Thrown when the webhook signature is invalid or missing.
- `Error`: Thrown if the request body cannot be parsed as JSON.
```
