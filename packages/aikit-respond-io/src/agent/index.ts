import { Client, ClientConfig } from "../client";
import { Webhook, WebhookConfig } from "../webhook";
import { WebhookEvents, MessageReceivedPayload } from "../webhook/types";

import type { ContactIdentifier, SendMessageResponse } from "../client/types";

/**
 * A simplified agent for interacting with the API.
 */
export class Agent {
  private readonly webhook: Webhook;
  private readonly client: Client;

  /**
   * Creates a new agent instance.
   * @param config Configuration for the webhook handler and API client.
   */
  constructor(config: {
    webhookConfig: WebhookConfig;
    clientConfig: ClientConfig;
  }) {
    this.webhook = new Webhook(config.webhookConfig);
    this.client = new Client(config.clientConfig);
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
   * Processes an incoming webhook request.
   *
   * This method should be called from your server's route handler.
   * It verifies the request signature and dispatches the event to the appropriate listener.
   *
   * @param request The incoming Request object (e.g., from a Fetch API compatible environment).
   * @throws {WebhookError} If the signature is invalid or the event is unhandled.
   */
  public async processWebhook(request: Request): Promise<void> {
    await this.webhook.process(request);
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
    contactId = String(contactId);
    const identifier: ContactIdentifier = contactId.includes(":")
      ? (contactId as ContactIdentifier)
      : `id:${contactId}`;

    return this.client.sendMessage(identifier, {
      message: { type: "text", text: text },
    });
  }
}
