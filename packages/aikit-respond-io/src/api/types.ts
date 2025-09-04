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
 * Represents the content of a message to be sent via Respond.io.
 */
export type MessageContent = TextMessage | AttachmentMessage;

/**
 * Represents the payload for sending a message to a contact via Respond.io.
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
 * Represents the successful response from sending a message via Respond.io.
 */
export interface SendMessageResponse {
  messageId: string;
  // Respond.io documentation mentions a 200 status with messageId.
  // Add other properties if the API returns more details on success.
}

/**
 * Configuration for the Respond.io API client.
 */
export interface RespondIoApiClientConfig {
  apiKey: string;
  baseUrl?: string; // Optional: Defaults to Respond.io's official API URL
}

/**
 * Represents a type-safe contact identifier for Respond.io.
 * Can be in the format 'id:<string>', 'email:<string>', or 'phone:<string>'.
 */
export type ContactIdentifier =
  | `id:${string}`
  | `email:${string}`
  | `phone:${string}`;
