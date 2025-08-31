import ky, { HTTPError, TimeoutError, type KyInstance } from "ky";

import { RespondIoApiError, RespondIoNetworkError } from "./errors";
import {
  ContactIdentifier,
  RespondIoClientConfig,
  SendMessagePayload,
  SendMessageResponse,
} from "./types";

export class RespondIoClient {
  private kyInstance: KyInstance;
  private readonly DEFAULT_BASE_URL = "https://api.respond.io/v2";

  constructor(config: RespondIoClientConfig) {
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
        `contact/${identifier}/message`,
        payload,
      );
      return await response.json<SendMessageResponse>();
    } catch (error) {
      if (error instanceof HTTPError) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorBody = await error.response.json();
        throw new RespondIoApiError(
          error.response.status,
          errorBody,
          `Respond.io API Error: ${error.response.status} - ${error.message}`,
        );
      } else if (error instanceof TimeoutError) {
        // The request was made but no response was received
        throw new RespondIoNetworkError(
          `Respond.io Network Error: Request timed out - ${error.message}`,
        );
      } else if (error instanceof Error && error.name === "TypeError") {
        // This can happen for various network reasons (e.g., DNS, connection refused)
        throw new RespondIoNetworkError(
          `Respond.io Network Error: No response received - ${error.message}`,
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Respond.io Request Error: ${error.message}`);
      }
    }
  }

  // FUTURE: Add other Respond.io API methods here as needed
  // public async createContact(...) { ... }
  // public async getContact(...) { ... }
}

export * from "./types";
export * from "./errors";
