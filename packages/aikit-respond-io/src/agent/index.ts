import { RespondIoApiClient, RespondIoApiClientConfig } from "../api";
import { RespondIoWebhook, RespondIoWebhookConfig } from "../webhook";
import { RespondIoEvents, MessageReceivedPayload } from "../webhook/types";

import type { ContactIdentifier, SendMessageResponse } from "../api/types";

/**
 * A simplified agent for interacting with the Respond.io API.
 */
export class RespondIoAgent {
  private readonly webhook: RespondIoWebhook;
  private readonly apiClient: RespondIoApiClient;

  /**
   * Creates a new Respond.io agent instance.
   * @param config Configuration for the webhook handler and API client.
   */
  constructor(config: {
    webhookConfig: RespondIoWebhookConfig;
    apiConfig: RespondIoApiClientConfig;
  }) {
    this.webhook = new RespondIoWebhook(config.webhookConfig);
    this.apiClient = new RespondIoApiClient(config.apiConfig);
  }

  /**
   * Registers a callback that runs when a new message is received.
   * @param callback The function to execute with the message payload.
   */
  public onMessageReceived(
    callback: (payload: MessageReceivedPayload) => void | Promise<void>,
  ) {
    this.webhook.on(RespondIoEvents.MessageReceived, callback);
  }

  /**
   * Processes an incoming webhook request from Respond.io.
   *
   * This method should be called from your server's route handler.
   * It verifies the request signature and dispatches the event to the appropriate listener.
   *
   * @param request The incoming Request object (e.g., from a Fetch API compatible environment).
   * @throws {RespondIoWebhookError} If the signature is invalid or the event is unhandled.
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

    return this.apiClient.sendMessage(identifier, {
      message: { type: "text", text: text },
    });
  }
}
