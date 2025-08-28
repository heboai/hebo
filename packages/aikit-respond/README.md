# aikit-respond

A library to help setup webhook for respond.io integration using a clean, event-based API.

## Installation

```bash
bun add @hebo/aikit-respond
```

## Usage

This library provides a `RespondIoWebhook` class for handling webhooks and a `RespondIoClient` class for interacting with the Respond.io API.

### Example with Express

**Important**: You must use a middleware that provides the raw request body for signature verification. Do not use a middleware that parses the JSON body beforehand.

```ts
import express from "express";
import {
  RespondIoWebhook,
  RespondIoEvents,
  MessageReceivedPayload,
  ConversationClosedPayload,
} from "@hebo/aikit-respond";

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

## Webhook Usage

### `new RespondIoWebhook()`

Creates a new webhook handler instance.

### `.on(eventType, signingKey, callback)`

Registers a handler for a specific event type. This will overwrite any existing handler for the same event.

- `eventType` (`RespondIoEvents`): The event type enum.
- `signingKey` (`string`): The signing key for this specific event type.
- `callback` (`(payload: WebhookPayload) => void | Promise<void>`): The function to execute when a verified event is received. The `payload` argument is of type `WebhookPayload`.
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

### Exported Types

In addition to `RespondIoWebhook`, `RespondIoEvents`, `EventHandler`, `ErrorHandler`, `HandlerConfig`, and `WebhookPayload`, the following specific payload interfaces are also exported for direct use:

- `MessageReceivedPayload`
- `MessageSentPayload`
- `ContactAssigneeUpdatedPayload`
- `ConversationClosedPayload`

### Errors

The library can throw the following errors from the `.process()` method if they are not handled by an `onError` callback:

- `RespondIoError`: A generic error, e.g., if no handler is registered for an event.
- `SignatureVerificationError`: Thrown when the webhook signature is invalid or missing.
- `Error`: Thrown if the request body cannot be parsed as JSON.

## API Client Usage

This library also provides a client for sending messages and interacting with the Respond.io API.

### Example with AWS Lambda

```ts
import { RespondIoClient } from "@hebo/aikit-respond";

// Initialize the RespondIo client with your API key.
// It's recommended to use environment variables for sensitive information.
const respondIoClient = new RespondIoClient({
  apiKey: process.env.RESPOND_IO_API_KEY!,
});

export const handler = async (event: {
  contactIdentifier: string; // e.g., "id:123", "phone:+1234567890"
  messageText: string;
}) => {
  try {
    const { contactIdentifier, messageText } = event;

    // Send a text message to the specified contact.
    const response = await respondIoClient.sendMessage(contactIdentifier, {
      message: {
        type: "text",
        text: messageText,
      },
    });

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

### `new RespondIoClient(config)`

Creates a new Respond.io API client instance.

- `config` (`RespondIoClientConfig`):
  - `apiKey` (`string`): Your Respond.io API key.
  - `apiBaseUrl` (`string`, optional): The base URL for the Respond.io API. Defaults to `https://api.respond.io/v2`.

### `.sendMessage(contactIdentifier, message)`

Sends a message to a specific contact.

- `contactIdentifier` (`string`): The identifier of the contact (e.g., `id:123`, `phone:+1234567890`).
- `message` (`any`): The message payload. Refer to Respond.io API documentation for message formats.
- **Returns**: A promise that resolves with the API response.

### `.sendMediaMessage(contactIdentifier, mediaUrl, caption?)`

Sends a media message (image, video, audio, file) to a specific contact.

- `contactIdentifier` (`string`): The identifier of the contact.
- `mediaUrl` (`string`): The URL of the media file.
- `caption` (`string`, optional): The caption for the media.
- **Returns**: A promise that resolves with the API response.

### `.sendTemplateMessage(contactIdentifier, templateId, variables?)`

Sends a template message to a specific contact.

- `contactIdentifier` (`string`): The identifier of the contact.
- `templateId` (`string`): The ID of the template to send.
- `variables` (`Record<string, any>`, optional): An object containing variables for the template.
- **Returns**: A promise that resolves with the API response.

### `.createContact(contactData)`

Creates a new contact.

- `contactData` (`any`): The contact data. Refer to Respond.io API documentation for contact data format.
- **Returns**: A promise that resolves with the API response.

### `.updateContact(contactIdentifier, contactData)`

Updates an existing contact.

- `contactIdentifier` (`string`): The identifier of the contact to update.
- `contactData` (`any`): The updated contact data.
- **Returns**: A promise that resolves with the API response.

### `.getContact(contactIdentifier)`

Retrieves contact details.

- `contactIdentifier` (`string`): The identifier of the contact.
- **Returns**: A promise that resolves with the API response.

### `.closeConversation(contactIdentifier)`

Closes the conversation with a specific contact.

- `contactIdentifier` (`string`): The identifier of the contact.
- **Returns**: A promise that resolves with the API response.
