import { RespondIoApiClient, RespondIoClientConfig } from "../api";
import { RespondIoWebhook, RespondIoWebhookConfig } from "../webhook";
import { ActionContext } from "./types";

import type { Trigger } from "./triggers";
import type { AnyAction } from "./types";
import type { ContactIdentifier, SendMessageResponse } from "../api/types";

/**
 * The main application class for creating Respond.io AI agents.
 */
export class RespondIoApp {
  private readonly webhook: RespondIoWebhook;
  private readonly apiClient: RespondIoApiClient;

  /**
   * Creates a new Respond.io application instance.
   * @param config Configuration for the webhook handler and API client.
   */
  constructor(config: {
    webhookConfig: RespondIoWebhookConfig;
    apiConfig: RespondIoClientConfig;
  }) {
    this.webhook = new RespondIoWebhook(config.webhookConfig);
    this.apiClient = new RespondIoApiClient(config.apiConfig);
  }

  /**
   * Registers a workflow that runs when a specific trigger occurs.
   * @param trigger The trigger to listen for (e.g., `Triggers.messageReceived()`).
   * @param callback The function to execute with the trigger payload and a context for performing actions.
   */
  public on<T extends { contact?: { id: number | string } }>( // A simple constraint to ensure payload has a contact
    trigger: Trigger<T>,
    callback: (payload: T, context: ActionContext) => void | Promise<void>,
  ) {
    this.webhook.on(trigger.eventType, (payload) => {
      // Create a stateful context for this specific trigger event
      const context: ActionContext = this.createActionContext(
        `id:${payload.contact?.id}`,
      );
      // Execute the user's workflow
      callback(payload, context);
    });
  }

  /**
   * Executes a self-contained action that is not tied to a trigger's context.
   * The action payload must contain all necessary information, including the contact identifier.
   * @param action The action to execute.
   */
  public async execute(action: AnyAction): Promise<any> {
    switch (action.type) {
      case "sendTextMessage": {
        if (!action.payload.identifier) {
          throw new Error(
            "Cannot execute sendTextMessage action outside of a trigger context without an explicit identifier.",
          );
        }
        return this.apiClient.sendMessage(action.payload.identifier, {
          message: { type: "text", text: action.payload.text },
        });
      }
      default: {
        throw new Error(`Unknown action type: ${(action as AnyAction).type}`);
      }
    }
  }

  /**
   * Returns the low-level webhook processing function to be used with a web server.
   * @returns The webhook handler function.
   */
  public getWebhookHandler() {
    return this.webhook.process.bind(this.webhook);
  }

  private createActionContext(
    contactIdentifier: ContactIdentifier,
  ): ActionContext {
    return {
      execute: async (
        action: AnyAction,
      ): Promise<SendMessageResponse | void> => {
        switch (action.type) {
          case "sendTextMessage": {
            // If the action has its own identifier, use it. Otherwise, use the context's identifier.
            const identifier = action.payload.identifier ?? contactIdentifier;
            return this.apiClient.sendMessage(identifier, {
              message: { type: "text", text: action.payload.text },
            });
          }
          default: {
            throw new Error(
              `Unknown action type: ${(action as AnyAction).type}`,
            );
          }
        }
      },
    };
  }
}
