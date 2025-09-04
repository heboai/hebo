/**
 * Base error class for all client related errors.
 */
export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientError";
    Object.setPrototypeOf(this, ClientError.prototype);
  }
}

/**
 * Represents an error returned by the API (e.g., 4xx or 5xx status codes).
 */
export class ClientFailureError extends ClientError {
  public statusCode: number;
  public apiResponse: any; // The raw error response from the API

  constructor(
    statusCode: number,
    apiResponse: any,
    message: string = "API Error",
  ) {
    super(message);
    this.name = "ClientFailureError";
    this.statusCode = statusCode;
    this.apiResponse = apiResponse;
    Object.setPrototypeOf(this, ClientFailureError.prototype);
  }
}

/**
 * Represents a network-related error when communicating with the API (e.g., no internet connection, timeout).
 */
export class ClientNetworkError extends ClientError {
  constructor(message: string = "Network Error") {
    super(message);
    this.name = "ClientNetworkError";
    Object.setPrototypeOf(this, ClientNetworkError.prototype);
  }
}
