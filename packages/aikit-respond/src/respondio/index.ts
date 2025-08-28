import axios, { AxiosInstance, AxiosError } from "axios";

import { RespondIoApiError, RespondIoNetworkError } from "./errors";
import {
  RespondIoClientConfig,
  SendMessagePayload,
  SendMessageResponse,
} from "./types";

export class RespondIoClient {
  private axiosInstance: AxiosInstance;
  private readonly DEFAULT_BASE_URL = "https://api.respond.io/v2";

  constructor(config: RespondIoClientConfig) {
    if (!config.apiKey) {
      throw new Error("Respond.io API Key is required.");
    }

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl || this.DEFAULT_BASE_URL,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10_000, // 10 seconds timeout
    });

    // Add an interceptor to handle API and network errors consistently
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new RespondIoApiError(
            error.response.status,
            error.response.data,
            `Respond.io API Error: ${error.response.status} - ${error.message}`,
          );
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          throw new RespondIoNetworkError(
            `Respond.io Network Error: No response received - ${error.message}`,
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(`Respond.io Request Error: ${error.message}`);
        }
      },
    );
  }

  /**
   * Sends a message to a specific contact via Respond.io.
   * @param identifier The contact identifier (e.g., 'id:123', 'email:abdc@gmail.com', 'phone:+60121233112').
   * @param payload The message payload.
   * @returns The response from the Respond.io API.
   */
  public async sendMessage(
    identifier: string,
    payload: SendMessagePayload,
  ): Promise<SendMessageResponse> {
    try {
      const response = await this.axiosInstance.post<SendMessageResponse>(
        `/contact/${identifier}/message`,
        payload,
      );
      return response.data;
    } catch (error) {
      // The interceptor already handles throwing custom errors, so just re-throw
      throw error;
    }
  }

  // Add other Respond.io API methods here as needed
  // public async createContact(...) { ... }
  // public async getContact(...) { ... }
}
