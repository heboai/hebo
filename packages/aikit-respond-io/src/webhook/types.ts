// packages/aikit-respond-io/src/webhook/types.ts

export type EventHandler<T extends WebhookPayload> = (
  payload: T,
) => void | Promise<void>;

export type ErrorHandler = (error: unknown) => void | Promise<void>;

export interface WebhookHandlerOptions<T extends WebhookPayload> {
  signingKey: string;
  handle: EventHandler<T>;
  onError?: ErrorHandler;
}

export type WebhookPayload =
  | MessageReceivedPayload
  | MessageSentPayload
  | ContactAssigneeUpdatedPayload
  | ConversationClosedPayload;

// --- Common Base Interfaces ---

interface BaseUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface BaseContact {
  id: number;
  status: "open" | "closed";
  lifecycle: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  language: string | null;
  profilePic: string | null;
  countryCode: string | null;
  assignee: BaseUser | null;
  created_at: number;
  tags?: string[];
  custom_fields?: { name: string; value: string | null }[] | null;
}

interface BaseChannel {
  id: number;
  name: string;
  source: string;
  meta: string;
  created_at: number;
}

// --- Message Content Types ---

export interface TextContent {
  type: "text";
  text: string;
  messageTag?: string;
}

export interface AttachmentContent {
  type: "attachment";
  attachment: {
    type: "image" | "file" | "video" | "audio";
    url: string;
    isPending: boolean;
    fileName: string;
    ext: string;
    size: string;
    mime: string;
  };
}

export interface BaseMessage {
  messageId: number;
  channelMessageId: number;
  contactId: number;
  channelId: number;
  traffic: "incoming" | "outgoing";
  message: MessageContent;
  timestamp: number;
  status?: { value: string; timestamp: number; message: string }[];
}

export type MessageContent = TextContent | AttachmentContent;

export interface MessageReceivedPayload {
  event_id: string;
  event_type: "message.received";
  contact: BaseContact;
  channel: BaseChannel;
  message: BaseMessage;
}

export interface MessageSentPayload {
  event_id: string;
  event_type: "message.sent";
  contact: BaseContact;
  channel: BaseChannel & {
    lastMessageTime: number;
    lastIncomingMessageTime: number;
  };
  message: BaseMessage;
}

export interface ContactAssigneeUpdatedPayload {
  event_id: string;
  event_type: "contact.assignee.updated";
  contact: BaseContact;
}

export interface ConversationClosedPayload {
  event_id: string;
  event_type: "conversation.closed";
  contact: BaseContact;
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
