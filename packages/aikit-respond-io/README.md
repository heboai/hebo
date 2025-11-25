# @hebo/aikit-respond-io

A library to help setup webhook for respond.io integration using a clean, event-based API.

## Motivation

Integrating with third-party webhooks often requires repetitive boilerplate: verifying signatures to ensure security, handling strict timeouts, and parsing untyped payloads. This library abstracts those complexities, providing a secure, type-safe, and resilient toolkit.

## Features

- **[Webhook Handler](#webhook-handler)**: Securely process incoming webhooks with signature verification, automatic background processing, and type-safe payloads.
- **[API Client](#api-client)**: A typed client for the Respond.io API, enabling seamless interaction with messaging, contacts, and comments.
- **[Integrations](#integrations)**: Ready-to-use examples for popular platforms.

## Installation

```bash
bun add @hebo/aikit-respond-io
```

## Webhook Handler

The `webhook` factory creates secure handlers that verify signatures and process events in the background.

### Basic Usage

Create a handler and define your logic.

```ts
import {
  webhook,
  MessageReceivedPayload,
} from "@hebo/aikit-respond-io/webhook";

// 1. Create the handler
const onMessage = webhook<MessageReceivedPayload>({
  signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
  handle: async (payload) => {
    console.log("New message:", payload.message.message.text);
    // Your logic here...
  },
  onError: (err) => console.error("Webhook failed:", err),
});

// 2. Use it in your server (e.g., Hono, Next.js, Workers)
// It exposes a standard Fetch API compatible method
app.post("/webhook", onMessage.fetch);
```

### Supported Events

The `webhook` handler supports various event types from Respond.io. Here are some of the most common ones:

- `MessageReceivedPayload`: When a new message is received from a contact.
- `ConversationClosedPayload`: When a conversation is closed.
- `MessageSentPayload`: When a message is successfully sent to a contact.
- `ContactAssigneeUpdatedPayload`: When a contact's assignee changes.

To handle a specific event, specify its payload type:

```ts
import {
  webhook,
  MessageReceivedPayload,
} from "@hebo/aikit-respond-io/webhook";

const messageWebhook = webhook<MessageReceivedPayload>({
  signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
  handle: async (payload) => {
    console.log(
      `Received message from contact ${payload.contact.id}: ${payload.message.message.text}`,
    );
  },
  onError: (error) => {
    console.error("Error processing message webhook:", error);
  },
});

// Mount this handler to its specific endpoint
app.post("/webhook/message-received", messageWebhook.fetch);
```

## API Client

The `client` provides a typed interface for the Respond.io API.

### Initialization

```ts
import { client } from "@hebo/aikit-respond-io/client";

const api = client({ apiKey: process.env.RESPOND_IO_API_KEY! });
const user = "email:user@example.com"; // or "id:123", "phone:+1..."
```

### Messaging

Send text or attachments to a contact.

```ts
await api.messaging.sendMessage(user, {
  message: { type: "text", text: "Hello!" },
});
```

### Contacts

Manage contact properties like tags.

```ts
await api.contact.tags.add(user, ["vip", "subscriber"]);
```

### Comments

Add internal notes to a conversation.

```ts
await api.comment.create(user, {
  text: "Customer requested a callback.",
});
```

## Integrations

### AWS Lambda Function URL

Deploy your webhook handler as a standalone AWS Lambda function.

```ts
import {
  webhook,
  MessageReceivedPayload,
} from "@hebo/aikit-respond-io/webhook";
import { APIGatewayProxyEventV2 } from "aws-lambda";

const onMessage = webhook<MessageReceivedPayload>({
  signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
  handle: async ({ contact }) => console.log(`Message from ${contact.id}`),
});

export const handler = async (event: APIGatewayProxyEventV2) => {
  const url = `https://${event.requestContext.domainName}${event.rawPath}`;
  const req = new Request(url, {
    method: event.requestContext.http.method,
    headers: event.headers as HeadersInit,
    body: event.body,
  });

  const res = await onMessage.fetch(req);

  return {
    statusCode: res.status,
    body: await res.text(),
  };
};
```

### Vercel AI SDK

Easily convert Respond.io payloads into AI SDK messages.

```ts
import { toAiModelMessage } from "@hebo/aikit-respond-io/webhook";
import { generateText } from "ai";

// Inside your webhook handle function:
handle: async (payload) => {
  const userMessage = toAiModelMessage(payload.message.message, "user");

  const { text } = await generateText({
    model: yourModel,
    messages: [userMessage],
  });
};
```

## Contributing

We welcome contributions!

- **Bug Reports & Feature Requests**: Please use the [issue tracker](https://github.com/heboai/hebo/issues) to report bugs or suggest features.
- **Pull Requests**: Specific fixes and improvements are welcome. Please open a PR.
