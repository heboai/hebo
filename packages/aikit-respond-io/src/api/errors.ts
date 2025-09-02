/**
 * Base error class for all Respond.io related errors.
 */
export class RespondIoApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RespondIoApiError";
    Object.setPrototypeOf(this, RespondIoApiError.prototype);
  }
}

/**
 * Represents an error returned by the Respond.io API (e.g., 4xx or 5xx status codes).
 */
export class RespondIoApiFailedError extends RespondIoApiError {
  public statusCode: number;
  public apiResponse: any; // The raw error response from the API

  constructor(
    statusCode: number,
    apiResponse: any,
    message: string = "Respond.io API Error",
  ) {
    super(message);
    this.name = "RespondIoApiFailedError";
    this.statusCode = statusCode;
    this.apiResponse = apiResponse;
    Object.setPrototypeOf(this, RespondIoApiFailedError.prototype);
  }
}

/**
 * Represents a network-related error when communicating with Respond.io (e.g., no internet connection, timeout).
 */
export class RespondIoApiNetworkError extends RespondIoApiError {
  constructor(message: string = "Respond.io Network Error") {
    super(message);
    this.name = "RespondIoNetworkError";
    Object.setPrototypeOf(this, RespondIoNetworkError.prototype);
  }
}
