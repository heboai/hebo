# aikit-respond-io

A library to help setup webhook for respond.io integration using a clean, event-based API.

## Installation

```bash
bun add @hebo/aikit-respond-io
```

## Usage

This library provides a `RespondIoWebhook` class for handling webhooks and a `RespondIoClient` class for interacting with the Respond.io API.

### Webhook Example with Express

**Important**: You must use a middleware that provides the raw request body for signature verification. Do not use a middleware that parses the JSON body beforehand.

```ts
import express from "express";
import {
  RespondIoWebhook,
  RespondIoEvents,
  MessageReceivedPayload,
  ConversationClosedPayload,
} from "@hebo/aikit-respond-io";

const app = express();

// 1. Create and configure the webhook handler instance.
const webhook = new RespondIoWebhook();

// 2. Register handlers for each event type.
webhook.on(
  RespondIoEvents.MessageReceived,
  process.env.RESPOND_IO_SIGNING_KEY!,
  (payload: MessageReceivedPayload) => {
    console.log("Got a new message:", payload.message.message.text);
    // Add your business logic here (e.g., save to database, send a reply).
  },
);

webhook.on(
  RespondIoEvents.ConversationClosed,
  process.env.RESPOND_IO_SIGNING_KEY!,
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
  RespondIoClient,
  SendMessagePayload,
  ContactIdentifier,
  TextMessage,
  SendMessageResponse,
} from "@hebo/aikit-respond-io/api";

// Initialize the RespondIo client with your API key.
// It's recommended to use environment variables for sensitive information.
const respondIoClient = new RespondIoClient({
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

    const response: SendMessageResponse = await respondIoClient.sendMessage(
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
