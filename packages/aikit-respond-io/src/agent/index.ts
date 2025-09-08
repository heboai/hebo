import {
  createRespondIoClient,
  RespondIoClient,
  RespondIoClientConfig,
} from "../client";
import { Webhook, WebhookConfig } from "../webhook";
import { WebhookEvents, MessageReceivedPayload } from "../webhook/types";

import type { ContactIdentifier, SendMessageResponse } from "../client/types";

/**
 * Configuration for the agent.
 */
export type AgentConfig = {
  webhookConfig: WebhookConfig;
  clientConfig: RespondIoClientConfig;
};

/**
 * A simplified agent for interacting with the API.
 */
export class Agent {
  private readonly webhook: Webhook;
  private readonly client: RespondIoClient;
  public readonly fetch: (request: Request) => Promise<Response>;

  /**
   * Creates a new agent instance.
   * @param config Configuration for the webhook handler and API client.
   */
  constructor(config: AgentConfig) {
    this.webhook = new Webhook(config.webhookConfig);
    this.client = createRespondIoClient(config.clientConfig);
    this.fetch = async (request: Request): Promise<Response> => {
      return await this.webhook.fetch(request);
    };
  }

  /**
   * Registers a callback that runs when a new message is received.
   * @param callback The function to execute with the message payload.
   */
  public onMessageReceived(
    callback: (payload: MessageReceivedPayload) => void | Promise<void>,
  ) {
    this.webhook.on(WebhookEvents.MessageReceived, callback);
  }

  /**
   * Sends a text message to a contact.
   * @param text The message content.
   * @param contactId The identifier of the contact to send the message to. Can be a raw ID string or a typed ContactIdentifier.
   * @returns A promise that resolves with the API response.
   */
  public async sendTextMessage(
    text: string,
    contactId: number | string | ContactIdentifier,
  ): Promise<SendMessageResponse> {
    const identifier: ContactIdentifier =
      typeof contactId === "string" && contactId.includes(":")
        ? (contactId as ContactIdentifier)
        : `id:${contactId}`;

    return this.client.sendMessage(identifier, {
      message: { type: "text", text: text },
    });
  }
}

/**
 * Creates a new agent instance.
 * @param config Configuration for the webhook handler and API client.
 * @returns A new Agent instance.
 */
export const createAgent = (config: AgentConfig): Agent => {
  return new Agent(config);
};
