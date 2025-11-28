# @hebo/aikit-respond-io

A library to help setup webhook for respond.io integration using a clean, event-based API.

## Installation

```bash
bun add @hebo/aikit-respond-io
```

## What This Library Offers

This library helps you build robust Respond.io integrations by providing simple, secure, and resilient tools.

- **`webhook`**: A factory function to create webhook handlers.
  - **Secure**: Automatically verifies webhook signatures using constant-time comparison to prevent timing attacks.
  - **Resilient**: Responds instantly to meet Respond.io's strict timeout, running your logic in the background.
  - **Compatibility**: Works with any framework that supports the standard Fetch API `Request` and `Response` objects (Hono, Next.js, Cloudflare Workers, etc.).
- **`client`**: A low-level client for making direct requests to the Respond.io API.

### Webhook Example with Hono

This section demonstrates how to create and mount a webhook handler using Hono.

```ts
import { Hono } from "hono";
import {
  webhook,
  MessageReceivedPayload,
  ConversationClosedPayload,
} from "@hebo/aikit-respond-io/webhook";

const app = new Hono();

// 1. Create and configure a webhook handler for MessageReceived events.
const messageReceivedWebhook = webhook<MessageReceivedPayload>({
  signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
  handle: (payload) => {
    console.log("Got a new message:", payload.message.message.text);
    // Add your business logic here (e.g., save to database, send a reply).
  },
  onError: (error) => {
    // This handler will be called for internal errors during processing or from the 'handle' function.
    console.log("[Webhook Error]", error);
  },
});

// 2. Create and configure a webhook handler for ConversationClosed events.
const conversationClosedWebhook = webhook<ConversationClosedPayload>({
  signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
  handle: (payload) => {
    console.log(`Conversation ${payload.conversation.summary} was closed.`);
    // Add your business logic here.
  },
  onError: (error) => {
    // This handler will be called for internal errors during processing or from the 'handle' function.
    console.log("[Webhook Error]", error);
  },
});

// 3. Mount the webhook handlers to their respective paths.
app.mount("/webhook/respond-io/message-received", messageReceivedWebhook.fetch);
app.mount(
  "/webhook/respond-io/conversation-closed",
  conversationClosedWebhook.fetch,
);

// For Cloudflare Workers, Vercel, etc., Hono exports `app` directly.
export default app;
```

### Webhook Example with AWS Lambda Function URL

For a direct, serverless deployment without API Gateway, you can use an [AWS Lambda Function URL](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html). This gives you a dedicated HTTPS endpoint for your function.

The function validates the request, and for longer-running tasks, it can pass the verified payload to an SQS queue for asynchronous processing.

```ts
import {
  webhook,
  MessageReceivedPayload,
} from "@hebo/aikit-respond-io/webhook";
// Note the specific event/result types for Function URLs
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

// This is the main Lambda handler, compatible with a Function URL trigger
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  // 1. Create and configure a webhook handler for MessageReceived events.
  const messageReceivedWebhook = webhook<MessageReceivedPayload>({
    signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
    handle: async (payload) => {
      console.log(`Verified message from ${payload.contact.id}.`);
      // Here you could add it to an SQS queue for async processing
    },
  });

  // The domain/path are part of the V2 event structure
  const url = `https://${event.requestContext.domainName}${event.rawPath}`;

  // Create a standard Request object from the Function URL event
  const request = new Request(url, {
    method: event.requestContext.http.method,
    headers: event.headers as HeadersInit,
    body: event.body,
  });

  // Process the incoming request using the webhook handler.
  const response = await messageReceivedWebhook.fetch(request);

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
  client,
  SendMessagePayload,
  ContactIdentifier,
  TextMessage,
  SendMessageResponse,
} from "@hebo/aikit-respond-io/client";

const app = new Hono();

// Initialize the client with your API key.
// It's recommended to use environment variables for sensitive information.
const apiClient = client({
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

    const response: SendMessageResponse = await apiClient.messaging.sendMessage(
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

### Utilities

#### Vercel AI SDK Integration

The `@hebo/aikit-respond-io` package provides a `toAiModelMessage` utility function to easily convert a Respond.io message payload into a `ModelMessage` compatible with the [Vercel AI SDK](https://sdk.vercel.ai/).

```ts
import {
  webhook,
  toAiModelMessage,
  MessageReceivedPayload,
} from "@hebo/aikit-respond-io/webhook";
import { ModelMessage } from "ai";
import { generateText } from "ai";

// Create a webhook handler specifically for message received events
const aiWebhookHandler = webhook<MessageReceivedPayload>({
  signingKey: process.env.RESPOND_IO_SIGNING_KEY!, // Use your signing key
  handle: async (payload) => {
    try {
      // Convert the incoming message to a user message for the AI SDK
      const aiMessage: ModelMessage = toAiModelMessage(
        payload.message.message,
        "user",
      );

      // Assuming 'model' is defined
      // You can now use `aiMessage` with the Vercel AI SDK functions like `generateText`
      const result = await generateText({ model, messages: [aiMessage] });
      console.log("AI generated text:", result.text);
    } catch (error) {
      console.error("Failed to process AI message:", error);
    }
  },
  onError: (error) => {
    console.error("[AI Webhook Error]", error);
  },
});

// The .fetch method of this handler object can then be mounted to your framework, e.g., Hono or Lambda
export default aiWebhookHandler.fetch;
```
