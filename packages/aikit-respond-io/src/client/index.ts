import ky, { HTTPError, TimeoutError, type KyInstance } from "ky";

import {
  RespondIoClientFailureError,
  RespondIoClientNetworkError,
} from "./errors";
import {
  AddTagsPayload,
  AddTagsResponse,
  ContactIdentifier,
  RespondIoClientConfig,
  SendMessagePayload,
  SendMessageResponse,
  CreateCommentPayload,
  CreateCommentResponse,
} from "./types";

export class RespondIoClient {
  private kyInstance: KyInstance;
  private readonly DEFAULT_BASE_URL = "https://api.respond.io/v2";

  constructor(config: RespondIoClientConfig) {
    if (!config.apiKey) {
      throw new Error("API Key is required.");
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
   * Sends a message to a specific contact.
   * @param identifier The contact identifier (e.g., 'id:123', 'email:abdc@gmail.com', 'phone:+60121233112').
   * @param payload The message payload.
   * @returns The response from the API.
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
        throw new RespondIoClientFailureError(
          error.response.status,
          { json: errorBody },
          `API Error: ${error.response.status} - ${error.message}`,
        );
      } else if (error instanceof TimeoutError) {
        // The request was made but no response was received
        throw new RespondIoClientNetworkError(
          `Network Error: Request timed out - ${error.message}`,
        );
      } else if (error instanceof Error) {
        // This can happen for various network reasons (e.g., DNS, connection refused)
        if (error.name === "TypeError") {
          throw new RespondIoClientNetworkError(
            `Network Error: No response received - ${error.message}`,
          );
        }
        throw new Error(`Request Error: ${error.message}`);
      } else {
        // Something happened that triggered an error that wasn't an instance of Error
        throw new TypeError(
          `An unknown error occurred in request: ${String(error)}`,
        );
      }
    }
  }

  /**
   * Adds tags to a specific contact.
   * @param identifier The contact identifier (e.g., 'id:123', 'email:abdc@gmail.com', 'phone:+60121233112').
   * @param payload The tags to be added.
   * @returns The response from the API.
   */
  public async addTags(
    identifier: ContactIdentifier,
    payload: AddTagsPayload,
  ): Promise<AddTagsResponse> {
    try {
      const response = await this.kyInstance.post(
        `contact/${encodeURIComponent(identifier)}/tag`,
        { json: payload },
      );
      return await response.json<AddTagsResponse>();
    } catch (error) {
      if (error instanceof HTTPError) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorBody = await error.response.json();
        throw new RespondIoClientFailureError(
          error.response.status,
          { json: errorBody },
          `API Error: ${error.response.status} - ${error.message}`,
        );
      } else if (error instanceof TimeoutError) {
        // The request was made but no response was received
        throw new RespondIoClientNetworkError(
          `Network Error: Request timed out - ${error.message}`,
        );
      } else if (error instanceof Error) {
        // This can happen for various network reasons (e.g., DNS, connection refused)
        if (error.name === "TypeError") {
          throw new RespondIoClientNetworkError(
            `Network Error: No response received - ${error.message}`,
          );
        }
        throw new Error(`Request Error: ${error.message}`);
      } else {
        // Something happened that triggered an error that wasn't an instance of Error
        throw new TypeError(
          `An unknown error occurred in request: ${String(error)}`,
        );
      }
    }
  }

  /**
   * Creates a comment on a specific contact.
   * @param identifier The contact identifier (e.g., 'id:123', 'email:abdc@gmail.com', 'phone:+60121233112').
   * @param payload The comment payload.
   * @returns The response from the API.
   */
  public async createComment(
    identifier: ContactIdentifier,
    payload: CreateCommentPayload,
  ): Promise<CreateCommentResponse> {
    try {
      const response = await this.kyInstance.post(
        `contact/${encodeURIComponent(identifier)}/comment`,
        { json: payload },
      );
      return await response.json<CreateCommentResponse>();
    } catch (error) {
      if (error instanceof HTTPError) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorBody = await error.response.json();
        throw new RespondIoClientFailureError(
          error.response.status,
          { json: errorBody },
          `API Error: ${error.response.status} - ${error.message}`,
        );
      } else if (error instanceof TimeoutError) {
        // The request was made but no response was received
        throw new RespondIoClientNetworkError(
          `Network Error: Request timed out - ${error.message}`,
        );
      } else if (error instanceof Error) {
        // This can happen for various network reasons (e.g., DNS, connection refused)
        if (error.name === "TypeError") {
          throw new RespondIoClientNetworkError(
            `Network Error: No response received - ${error.message}`,
          );
        }
        throw new Error(`Request Error: ${error.message}`);
      } else {
        // Something happened that triggered an error that wasn't an instance of Error
        throw new TypeError(
          `An unknown error occurred in request: ${String(error)}`,
        );
      }
    }
  }

  // FUTURE: Add other API methods here as needed
  // public async createContact(...) { ... }
  // public async getContact(...) { ... }
}

export * from "./types";
export * from "./errors";

export const createRespondIoClient = (config: RespondIoClientConfig) => {
  return new RespondIoClient(config);
};
