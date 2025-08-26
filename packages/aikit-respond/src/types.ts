export const RespondIoEvents = {
  MESSAGE_RECEIVED: "message.received",
  MESSAGE_SENT: "message.sent",
  CONTACT_ASSIGNEE_UPDATED: "contact.assignee.updated",
  CONVERSATION_CLOSED: "conversation.closed",
} as const;

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
  event: "message.sent"; // Note: documentation shows 'New Outgoing Message', but using the event name from the user
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

// --- Event-to-Payload Mapping ---

/**
 * A map from event names to their corresponding payload types.
 * This is the core of the type-safe event handling system.
 */
export interface EventPayloadMap {
  [RespondIoEvents.MESSAGE_RECEIVED]: MessageReceivedPayload;
  [RespondIoEvents.MESSAGE_SENT]: MessageSentPayload;
  [RespondIoEvents.CONTACT_ASSIGNEE_UPDATED]: ContactAssigneeUpdatedPayload;
  [RespondIoEvents.CONVERSATION_CLOSED]: ConversationClosedPayload;

  /**
   * Fallback for any event not explicitly defined.
   * This allows for handling new or custom events.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
