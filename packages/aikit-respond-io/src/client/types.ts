export interface TextMessage {
  type: "text";
  text: string;
}

export interface AttachmentMessage {
  type: "attachment";
  url: string;
  fileName: string;
  caption?: string;
}

/**
 * Represents the content of a message to be sent.
 */
export type MessageContent = TextMessage | AttachmentMessage;

/**
 * Represents the payload for sending a message to a contact.
 */
export interface SendMessagePayload {
  channelId?: number; // Optional: The ID of the channel to send the message on.
  message: MessageContent;
  messageTag?:
    | "ACCOUNT_UPDATE"
    | "POST_PURCHASE_UPDATE"
    | "CONFIRMED_EVENT_UPDATE"
    | string; // For Facebook/Instagram outside 24h window
}

/**
 * Represents the successful response from sending a message.
 */
export interface SendMessageResponse {
  messageId: string;
}

/**
 * Configuration for the API client.
 */
export interface RespondIoClientConfig {
  apiKey: string;
  baseUrl?: string; // Optional: Defaults to the official API URL
}

/**
 * Represents a type-safe contact identifier.
 * Can be in the format 'id:<string>', 'email:<string>', or 'phone:<string>'.
 */
export type ContactIdentifier =
  | `id:${string}`
  | `email:${string}`
  | `phone:${string}`;
