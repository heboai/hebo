# @hebo/aikit-respond-io

A library to help setup webhook for respond.io integration using a clean, event-based API.

## Installation

```bash
bun add @hebo/aikit-respond-io
```

## Usage

This library provides three ways to interact with Respond.io:

- `createAdapter`: A factory function to create a high-level adapter that simplifies common workflows like receiving and sending messages.
- `createWebhookHandler`: A factory function to create a low-level webhook handler for processing events from Respond.io.
- `createRespondIoClient`: A factory function to create a low-level client for making requests to the Respond.io API.

### Adapter Example with Hono

The `Adapter`, created using the `createAdapter` factory, is the easiest way to get started. It combines the webhook and API client into a single, easy-to-use class.

```ts
import { Hono } from "hono";
import { createAdapter } from "@hebo/aikit-respond-io";
import { WebhookEvents } from "@hebo/aikit-respond-io/webhook";

const app = new Hono();

// 1. Create and configure the adapter.
//    It's recommended to use environment variables for sensitive information.
const adapter = createAdapter({
  webhookConfig: {
    events: {
      [WebhookEvents.MessageReceived]: {
        signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
      },
      // Add other event types you want the adapter to handle and their signing keys
    },
  },
  clientConfig: {
    apiKey: process.env.RESPOND_IO_API_KEY!,
  },
});

// 2. Register a handler for incoming messages.
adapter.onMessageReceived(async (payload) => {
  const contactId = String(payload.contact.id);
  const message = payload.message.message.text;

  console.log(`Received message "${message}" from contact ${contactId}`);

  // Example: Echo the message back to the user.
  if (message) {
    await adapter.sendTextMessage(`You said: ${message}`, contactId);
    console.log(`Replied to contact ${contactId}`);
  }
});

// 3. Mount the adapter's fetch handler under a specific path.
// Hono will forward all requests under this path to the adapter's fetch handler.
app.mount("/webhook/respond-io", adapter.fetch);

// For Cloudflare Workers, Vercel, etc., Hono exports `app` directly.
export default app;
```

### Webhook Example with Hono

The `Webhook` handler now includes a `fetch` method to simplify integration, which can be used directly with Hono's `app.mount`.

```ts
import { Hono } from "hono";
import {
  createWebhookHandler,
  WebhookEvents,
  MessageReceivedPayload,
  ConversationClosedPayload,
} from "@hebo/aikit-respond-io/webhook";

const app = new Hono();

// 1. Create and configure the webhook handler instance using the factory function.
const webhook = createWebhookHandler({
  events: {
    [WebhookEvents.MessageReceived]: {
      signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
    },
    [WebhookEvents.ConversationClosed]: {
      signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
    },
    // Add other event types you want to handle and their signing keys
  },
});

// 2. Register handlers for each event type.
webhook.on(WebhookEvents.MessageReceived, (payload: MessageReceivedPayload) => {
  console.log("Got a new message:", payload.message.message.text);
  // Add your business logic here (e.g., save to database, send a reply).
});

webhook.on(
  WebhookEvents.ConversationClosed,
  (payload: ConversationClosedPayload) => {
    console.log(`Conversation ${payload.conversation.summary} was closed.`);
    // Add your business logic here.
  },
);

// 3. (Optional) Register a global error handler.
webhook.onError((error) => {
  // This handler will be called by the `fetch` method for internal errors.
  console.error("[Webhook Error]", error.message);
});

// 4. Mount the webhook handler.
// Hono will forward all requests under this path to the webhook's fetch handler.
app.mount("/webhook/respond-io", webhook.fetch);

// For Cloudflare Workers, Vercel, etc., Hono exports `app` directly.
export default app;
```

### Webhook Example with AWS Lambda Function URL

For a direct, serverless deployment without API Gateway, you can use an [AWS Lambda Function URL](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html). This gives you a dedicated HTTPS endpoint for your function.

The function validates the request, and for longer-running tasks, it can pass the verified payload to an SQS queue for asynchronous processing.

```ts
import {
  createWebhookHandler,
  WebhookEvents,
} from "@hebo/aikit-respond-io/webhook";
// Note the specific event/result types for Function URLs
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

// This is the main Lambda handler, compatible with a Function URL trigger
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const webhook = createWebhookHandler({
    events: {
      [WebhookEvents.MessageReceived]: {
        signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
      },
    },
  });

  // Example: Log the message after it's been verified
  webhook.on(WebhookEvents.MessageReceived, async (payload) => {
    console.log(`Verified message from ${payload.contact.id}.`);
    // Here you could add it to an SQS queue for async processing
  });

  // The domain/path are part of the V2 event structure
  const url = `https://${event.requestContext.domainName}${event.rawPath}`;

  // Create a standard Request object from the Function URL event
  const request = new Request(url, {
    method: event.requestContext.http.method,
    headers: event.headers as HeadersInit,
    body: event.body,
  });

  // The fetch handler validates the signature and triggers any .on() handlers
  const response = await webhook.fetch(request);

  // Convert the standard Response back to the format Lambda expects
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
};
```

### API RespondIoClient Example with Hono

```ts
import { Hono } from "hono";
import {
  createRespondIoClient,
  SendMessagePayload,
  ContactIdentifier,
  TextMessage,
  SendMessageResponse,
} from "@hebo/aikit-respond-io/client";

const app = new Hono();

// Initialize the client with your API key.
// It's recommended to use environment variables for sensitive information.
const client = createRespondIoClient({
  apiKey: process.env.RESPOND_IO_API_KEY!,
});

app.post("/send-message", async (c) => {
  try {
    const { contactIdentifier, messageText } = await c.req.json<{
      contactIdentifier: ContactIdentifier; // e.g., "id:123", "phone:+1234567890"
      messageText: string;
    }>();

    const message: TextMessage = {
      type: "text",
      text: messageText,
    };

    const payload: SendMessagePayload = {
      message: message,
    };

    const response: SendMessageResponse = await client.sendMessage(
      contactIdentifier,
      payload,
    );

    console.log("Message sent successfully:", response);

    return c.json(
      {
        message: "Message sent successfully",
        messageId: response.messageId,
      },
      200,
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json(
      {
        message: "Failed to send message",
        error: (error as Error).message,
      },
      500,
    );
  }
});

// For Cloudflare Workers, Vercel, etc., Hono exports `app` directly.
export default app;
```
