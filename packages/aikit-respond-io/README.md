# @hebo/aikit-respond-io

A library to help setup webhook for respond.io integration using a clean, event-based API.

## Installation

```bash
bun add @hebo/aikit-respond-io
```

## Usage

This library provides three ways to interact with Respond.io:

- `createAgent`: A factory function to create a high-level agent that simplifies common workflows like receiving and sending messages.
- `createWebhookHandler`: A factory function to create a low-level webhook handler for processing events from Respond.io.
- `createRespondIoClient`: A factory function to create a low-level client for making requests to the Respond.io API.

### Agent Example with Hono

The `Agent`, created using the `createAgent` factory, is the easiest way to get started. It combines the webhook and API client into a single, easy-to-use class.

```ts
import { Hono } from "hono";
import { createAgent } from "@hebo/aikit-respond-io";
import { WebhookEvents } from "@hebo/aikit-respond-io/webhook";

const app = new Hono();

// 1. Create and configure the agent.
//    It's recommended to use environment variables for sensitive information.
const agent = createAgent({
  webhookConfig: {
    events: {
      [WebhookEvents.MessageReceived]: {
        signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
      },
      // Add other event types you want the agent to handle and their signing keys
    },
  },
  clientConfig: {
    apiKey: process.env.RESPOND_IO_API_KEY!,
  },
});

// 2. Register a handler for incoming messages.
agent.onMessageReceived(async (payload) => {
  const contactId = String(payload.contact.id);
  const message = payload.message.message.text;

  console.log(`Received message "${message}" from contact ${contactId}`);

  // Example: Echo the message back to the user.
  if (message) {
    await agent.sendTextMessage(`You said: ${message}`, contactId);
    console.log(`Replied to contact ${contactId}`);
  }
});

// 3. Mount the agent's fetch handler under a specific path.
// Hono will forward all requests under this path to the agent's fetch handler.
app.mount("/webhook/respond-io", agent.fetch);

// 4. Create the route handler for the webhook.
app.post("/webhook/respond-io", (c) => {
  // If we reach here, the webhook was successfully processed by the middleware
  return c.text("OK", 200);
});

// For local development with Node.js, you might use:
// import { serve } from "@hono/node-server";
// serve({
//   fetch: app.fetch,
//   port: 3000,
// }, () => {
//   console.log("Server listening on port 3000");
// });

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

// For local development with Node.js, you might use:
// import { serve } from "@hono/node-server";
// serve({
//   fetch: app.fetch,
//   port: 3000,
// }, () => {
//   console.log("Server listening on port 3000");
// });

// For Cloudflare Workers, Vercel, etc., Hono exports `app` directly.
export default app;
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

// For local development with Node.js, you might use:
// import { serve } from "@hono/node-server";
// serve({
//   fetch: app.fetch,
//   port: 3000,
// }, () => {
//   console.log("Server listening on port 3000");
// });

// For Cloudflare Workers, Vercel, etc., Hono exports `app` directly.
export default app;
```
