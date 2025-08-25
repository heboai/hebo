# aikit-respond

A library to help setup webhook for respond.io integration using a clean, event-based builder.

## Installation

```bash
npm install @hebo/aikit-respond
```

## Usage

This library provides a `RespondIoWebhook` class that allows you to register handlers for different webhook event types. It automatically handles signature verification based on the key you provide for each event.

### Example with Express

**Important**: You must use a middleware that provides the raw request body (as a Buffer or string) for signature verification. Do not use a middleware that parses the JSON body beforehand.

```ts
import express from "express";
import { RespondIoWebhook } from "@hebo/aikit-respond";
import type { RespondIoError } from "@hebo/aikit-respond";

const app = express();

// 1. Create and configure the webhook handler instance.
//    Chain .on() calls to register a signing key and callback for each event type.
const webhookHandler = new RespondIoWebhook()
  .on("message.created", process.env.RESPOND_IO_MESSAGE_KEY!, (data) => {
    // This callback is only executed for 'message.created' events
    // after the signature has been successfully verified.
    console.log("Got a new message:", data.message.text);
    // Add your business logic here (e.g., save to database, send a reply).
  })
  .on("contact.updated", process.env.RESPOND_IO_CONTACT_KEY!, (data) => {
    console.log("Contact was updated:", data.contact.name);
    // Add your business logic here.
  });

// 2. Create the route handler.
app.post(
  "/webhook/respond-io",
  // Use express.raw to get the raw body
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // 3. Pass the request to the handler.
      //    It will automatically verify the signature and call the correct callback.
      await webhookHandler.process(req.body.toString(), req.headers);
      res.status(200).send("OK");
    } catch (error) {
      const err = error as RespondIoError | Error;
      console.error("[Respond.io Webhook Error]", err.message);
      // Respond with a 400 Bad Request for any errors.
      return res.status(400).send(err.message);
    }
  },
);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

## API

### `new RespondIoWebhook(config?)`

Creates a new webhook handler instance.

- `config` (`WebhookConfig`, optional):
  - `headerName` (`string`, optional): The name of the signature header. Defaults to `x-respond-signature`.
  - `getEventType` (`(body: any) => string`, optional): A function to extract the event type from the parsed body. Defaults to `(body) => body.event.type`.

### `.on(eventType, signingKey, callback)`

Registers a handler for a specific event type.

- `eventType` (`string`): The event type string (e.g., 'message.created').
- `signingKey` (`string`): The signing key for this specific event type.
- `callback` (`(data: any) => void | Promise<void>`): The function to execute when a verified event is received.
- **Returns**: The `RespondIoWebhook` instance for chaining.

### `.process(body, headers)`

Processes an incoming webhook request.

- `body` (`string`): The raw request body string.
- `headers` (`Record<string, any>`): The request headers.
- **Returns**: A promise that resolves when the appropriate handler has been executed.
- **Throws**: `SignatureVerificationError`, `RespondIoError`, or `Error`.

## Errors

The library can throw the following errors from the `.process()` method:

- `RespondIoError`: A generic error, e.g., if no handler is registered for an event.
- `SignatureVerificationError`: Thrown when the webhook signature is invalid or missing.
- `Error`: Thrown if the request body cannot be parsed as JSON.
