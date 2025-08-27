export type WebhookPayload =
  | MessageReceivedPayload
  | MessageSentPayload
  | ContactAssigneeUpdatedPayload
  | ConversationClosedPayload;

export type EventHandler = (payload: WebhookPayload) => void | Promise<void>;
export type ErrorHandler = (error: Error) => void | Promise<void>;

export interface HandlerConfig {
  signingKey: string;
  callback: EventHandler;
}

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
      // Other message type fields can be added here
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
    assignee: object; // Can be an empty object
  };
  conversation: {
    category: string;
    summary: string;
    openedTime: number;
    openedBySource: string;
    closedTime: number;
    closedBy: object; // Can be an empty object
    closedBySource: string;
    firstResponseTime: number;
    resolutionTime: number;
    incomingMessageCount: number;
    outgoingMessageCount: number;
    assigneeTeam: string;
    lastAssignmentTime: number;
  };
}
