# aikit-respond-io

A library to help setup webhook for respond.io integration using a clean, event-based API.

## Installation

```bash
bun add @hebo/aikit-respond-io
```

## Usage

This library provides three ways to interact with Respond.io:

- `RespondIoAgent`: A high-level agent that simplifies common workflows like receiving and sending messages.
- `RespondIoWebhook`: A low-level webhook handler for processing events from Respond.io.
- `RespondIoApiClient`: A low-level client for making requests to the Respond.io API.

### Agent Example with Hono

The `RespondIoAgent` is the easiest way to get started. It combines the webhook and API client into a single, easy-to-use class.

```ts
import { Hono } from "hono";
import { RespondIoAgent, RespondIoEvents } from "@hebo/aikit-respond-io";

const app = new Hono();

// 1. Create and configure the agent.
//    It's recommended to use environment variables for sensitive information.
const agent = new RespondIoAgent({
  webhookConfig: {
    events: {
      [RespondIoEvents.MessageReceived]: {
        signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
      },
      // Add other event types you want the agent to handle and their signing keys
    },
  },
  apiConfig: {
    apiKey: process.env.RESPOND_IO_API_KEY!,
  },
});

// 2. Register a handler for incoming messages.
agent.onMessageReceived(async (payload) => {
  const contactId = payload.contact.id;
  const message = payload.message.message.text;

  console.log(`Received message "${message}" from contact ${contactId}`);

  // Example: Echo the message back to the user.
  if (message) {
    await agent.sendTextMessage(`You said: ${message}`, contactId);
    console.log(`Replied to contact ${contactId}`);
  }
});

// Middleware to process the webhook
app.use("/webhook/respond-io", async (c, next) => {
  try {
    await agent.processWebhook(c.req.raw);
    await next(); // Proceed to the next handler if successful
  } catch (error) {
    console.error("[Respond.io Agent Error]", (error as Error).message);
    return c.text((error as Error).message, 400);
  }
});

// 3. Create the route handler for the webhook.
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

**Important**: You must use a middleware that provides the raw request body for signature verification. Do not use a middleware that parses the JSON body beforehand.

```ts
import { Hono } from "hono";
import {
  RespondIoWebhook,
  RespondIoEvents,
  MessageReceivedPayload,
  ConversationClosedPayload,
} from "@hebo/aikit-respond-io/webhook";

const app = new Hono();

// 1. Create and configure the webhook handler instance.
//    Each event type you wish to handle must be explicitly configured with its signing key.
const webhook = new RespondIoWebhook({
  events: {
    [RespondIoEvents.MessageReceived]: {
      signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
    },
    [RespondIoEvents.ConversationClosed]: {
      signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
    },
    // Add other event types you want to handle and their signing keys
  },
});

// 2. Register handlers for each event type.
webhook.on(
  RespondIoEvents.MessageReceived,
  (payload: MessageReceivedPayload) => {
    console.log("Got a new message:", payload.message.message.text);
    // Add your business logic here (e.g., save to database, send a reply).
  },
);

webhook.on(
  RespondIoEvents.ConversationClosed,
  (payload: ConversationClosedPayload) => {
    console.log(`Conversation ${payload.conversation.summary} was closed.`);
    // Add your business logic here.
  },
);

// 3. (Optional) Register a global error handler.
webhook.onError((error) => {
  console.error("[Respond.io Webhook Error]", error.message);
});

// Middleware to process the webhook
app.use("/webhook/respond-io", async (c, next) => {
  try {
    await webhook.process(c.req.raw);
    await next(); // Proceed to the next handler if successful
  } catch (error) {
    // Errors from the webhook handler are caught here if not handled by `onError`
    // or if `onError` re-throws them.
    console.error("[Respond.io Webhook Error]", (error as Error).message);
    return c.text((error as Error).message, 400);
  }
});

// 4. Create the route handler.
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

### API Client Example with AWS Lambda

```ts
import {
  RespondIoApiClient,
  SendMessagePayload,
  ContactIdentifier,
  TextMessage,
  SendMessageResponse,
} from "@hebo/aikit-respond-io/api";

// Initialize the RespondIo client with your API key.
// It's recommended to use environment variables for sensitive information.
const respondIoApiClient = new RespondIoApiClient({
  apiKey: process.env.RESPOND_IO_API_KEY!,
});

export const handler = async (event: {
  contactIdentifier: ContactIdentifier; // e.g., "id:123", "phone:+1234567890"
  messageText: string;
}) => {
  try {
    const { contactIdentifier, messageText } = event;

    const message: TextMessage = {
      type: "text",
      text: messageText,
    };

    const payload: SendMessagePayload = {
      message: message,
    };

    const response: SendMessageResponse = await respondIoApiClient.sendMessage(
      contactIdentifier,
      payload,
    );

    console.log("Message sent successfully:", response);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Message sent successfully",
        messageId: response.messageId,
      }),
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to send message",
        error: (error as Error).message,
      }),
    };
  }
};
```
