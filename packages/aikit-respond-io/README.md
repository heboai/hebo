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

### Agent Example with Express

The `RespondIoAgent` is the easiest way to get started. It combines the webhook and API client into a single, easy-to-use class.

```ts
import express from "express";
import { RespondIoAgent } from "@hebo/aikit-respond-io";

const app = express();

// 1. Create and configure the agent.
//    It's recommended to use environment variables for sensitive information.
const agent = new RespondIoAgent({
  webhookConfig: {
    signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
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

// 3. Create the route handler for the webhook.
app.post(
  "/webhook/respond-io",
  // Use express.raw to get the raw body for signature verification.
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // 4. Pass the request to the agent's webhook processor.
      await agent.processWebhook(req.body.toString(), req.headers);
      res.status(200).send("OK");
    } catch (error) {
      console.error("[Respond.io Agent Error]", (error as Error).message);
      res.status(400).send((error as Error).message);
    }
  },
);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

### Webhook Example with Express

**Important**: You must use a middleware that provides the raw request body for signature verification. Do not use a middleware that parses the JSON body beforehand.

```ts
import express from "express";
import {
  RespondIoWebhook,
  RespondIoEvents,
  MessageReceivedPayload,
  ConversationClosedPayload,
} from "@hebo/aikit-respond-io/webhook";

const app = express();

// 1. Create and configure the webhook handler instance.
const webhook = new RespondIoWebhook({
    signingKey: process.env.RESPOND_IO_SIGNING_KEY!,
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
