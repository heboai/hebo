// packages/aikit-respond-io/src/webhook/types.ts
export enum WebhookEvents {
  MessageReceived = "message.received",
  MessageSent = "message.sent",
  ContactAssigneeUpdated = "contact.assignee.updated",
  ConversationClosed = "conversation.closed",
}

// New: Configuration for a single event type, allowing for future options.
export interface WebhookEventConfig {
  signingKey: string;
  // Future options can be added here, e.g.:
  // timeout?: number;
}

// Updated: Main config now uses WebhookEventConfig for extensibility.
export interface WebhookConfig {
  /**
   * A map of event types to their corresponding configurations.
   */
  events: Partial<Record<WebhookEvents, WebhookEventConfig>>;
}

// A map from event type to its payload interface.
export type EventPayloadMap = {
  [WebhookEvents.MessageReceived]: MessageReceivedPayload;
  [WebhookEvents.MessageSent]: MessageSentPayload;
  [WebhookEvents.ContactAssigneeUpdated]: ContactAssigneeUpdatedPayload;
  [WebhookEvents.ConversationClosed]: ConversationClosedPayload;
};

export type WebhookPayload =
  | MessageReceivedPayload
  | MessageSentPayload
  | ContactAssigneeUpdatedPayload
  | ConversationClosedPayload;

export type EventHandler<T extends WebhookPayload = WebhookPayload> = (
  payload: T,
) => void | Promise<void>;

export type ErrorHandler = (error: Error) => void | Promise<void>;

// --- Common Base Interfaces ---

interface BaseUser {
  id: number;
  name: string;
  email?: string;
}

interface BaseContact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  created_at: number;
}

interface BaseChannel {
  id: number;
  name: string;
  source: string;
}

// --- Event-Specific Payload Interfaces ---

export interface MessageReceivedPayload {
  event_type: "message.received";
  timestamp: number;
  contact: BaseContact & { assignee: BaseUser };
  channel: BaseChannel;
  message: {
    channelMessageId: number;
    contactId: number;
    traffic: "incoming";
    message: {
      type: string; // 'text', 'image', etc.
      text?: string;
      // FUTURE: Other message type fields can be added here
    };
    timestamp: number;
  };
}

export interface MessageSentPayload {
  event_type: "message.sent";
  traffic: "outgoing";
  channelMessageId: number;
  timestamp: number;
  contact: BaseContact & { assignee: BaseUser };
  channel: BaseChannel & {
    lastMessageTime: number;
    lastIncomingMessageTime: number;
  };
  message: {
    type: string;
    text?: string;
  };
  user: BaseUser;
}

export interface ContactAssigneeUpdatedPayload {
  event_type: "contact.assignee.updated";
  event_id: string;
  contact: BaseContact & {
    language: string;
    profilePic: string;
    countryCode: string;
    status: string;
    assignee: BaseUser;
    lifecycle: string;
  };
  channel: BaseChannel & { meta: null };
}

export interface ConversationClosedPayload {
  event_type: "conversation.closed";
  event_id: string;
  contact: BaseContact & {
    language: string;
    profilePic: string;
    countryCode: string;
    status: string;
    assignee: BaseUser | null | Record<string, never>; // May be empty
  };
  conversation: {
    category: string;
    summary: string;
    openedTime: number;
    openedBySource: string;
    closedTime: number;
    closedBy: BaseUser | null | Record<string, never>; // May be empt
    closedBySource: string;
    firstResponseTime: number;
    resolutionTime: number;
    incomingMessageCount: number;
    outgoingMessageCount: number;
    assigneeTeam: string;
    lastAssignmentTime: number;
  };
}
