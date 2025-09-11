/**
 * Base error class for all client related errors.
 */
export class RespondIoClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RespondIoClientError";
    Object.setPrototypeOf(this, RespondIoClientError.prototype);
  }
}

/**
 * Represents an error returned by the API (e.g., 4xx or 5xx status codes).
 */
export class RespondIoClientFailureError extends RespondIoClientError {
  public statusCode: number;
  public apiResponse: any; // The raw error response from the API

  constructor(
    statusCode: number,
    apiResponse: any,
    message: string = "API Error",
  ) {
    super(message);
    this.name = "RespondIoClientFailureError";
    this.statusCode = statusCode;
    this.apiResponse = apiResponse;
    Object.setPrototypeOf(this, RespondIoClientFailureError.prototype);
  }
}

/**
 * Represents a network-related error when communicating with the API (e.g., no internet connection, timeout).
 */
export class RespondIoClientNetworkError extends RespondIoClientError {
  constructor(message: string = "Network Error") {
    super(message);
    this.name = "RespondIoClientNetworkError";
    Object.setPrototypeOf(this, RespondIoClientNetworkError.prototype);
  }
}
