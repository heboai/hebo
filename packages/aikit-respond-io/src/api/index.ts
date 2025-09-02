import ky, { HTTPError, TimeoutError, type KyInstance } from "ky";

import { RespondIoApiFailedError, RespondIoApiNetworkError } from "./errors";
import {
  ContactIdentifier,
  RespondIoApiClientConfig,
  SendMessagePayload,
  SendMessageResponse,
} from "./types";

export class RespondIoApiClient {
  private kyInstance: KyInstance;
  private readonly DEFAULT_BASE_URL = "https://api.respond.io/v2";

  constructor(config: RespondIoApiClientConfig) {
    if (!config.apiKey) {
      throw new Error("Respond.io API Key is required.");
    }

    this.kyInstance = ky.create({
      prefixUrl: config.baseUrl || this.DEFAULT_BASE_URL,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10_000, // 10 seconds timeout
      retry: { limit: 0 },
    });
  }

  /**
   * Sends a message to a specific contact via Respond.io.
   * @param identifier The contact identifier (e.g., 'id:123', 'email:abdc@gmail.com', 'phone:+60121233112').
   * @param payload The message payload.
   * @returns The response from the Respond.io API.
   */
  public async sendMessage(
    identifier: ContactIdentifier,
    payload: SendMessagePayload,
  ): Promise<SendMessageResponse> {
    try {
      const response = await this.kyInstance.post(
        `contact/${encodeURIComponent(identifier)}/message`,
        { json: payload },
      );
      return await response.json<SendMessageResponse>();
    } catch (error) {
      if (error instanceof HTTPError) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorBody = await error.response.json();
        throw new RespondIoApiFailedError(
          error.response.status,
          { json: errorBody },
          `Respond.io API Error: ${error.response.status} - ${error.message}`,
        );
      } else if (error instanceof TimeoutError) {
        // The request was made but no response was received
        throw new RespondIoApiNetworkError(
          `Respond.io Network Error: Request timed out - ${error.message}`,
        );
      } else if (error instanceof Error) {
        // This can happen for various network reasons (e.g., DNS, connection refused)
        if (error.name === "TypeError") {
          throw new RespondIoApiNetworkError(
            `Respond.io Network Error: No response received - ${error.message}`,
          );
        }
        throw new Error(`Respond.io Request Error: ${error.message}`);
      } else {
        // Something happened that triggered an error that wasn't an instance of Error
        throw new TypeError(
          `An unknown error occurred in Respond.io request: ${String(error)}`,
        );
      }
    }
  }

  // FUTURE: Add other Respond.io API methods here as needed
  // public async createContact(...) { ... }
  // public async getContact(...) { ... }
}

export * from "./types";
export * from "./errors";
