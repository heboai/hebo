/**
 * Represents the content of a message to be sent via Respond.io.
 * Extend this for other message types (e.g., image, file).
 */
export interface MessageContent {
  type: "text" | string; // 'text', 'image', 'file', etc.
  text?: string; // Required for type 'text'
  // Add properties for other message types as needed, e.g.,
  // imageUrl?: string;
  // fileUrl?: string;
  // fileName?: string;
}

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
export interface RespondIoClientConfig {
  apiKey: string;
  baseUrl?: string; // Optional: Defaults to Respond.io's official API URL
}
