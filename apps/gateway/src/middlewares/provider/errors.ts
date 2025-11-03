export class BadRequestError extends Error {
  status: number;
  type: string;
  code: string;
  constructor(message: string, code = "model_mismatch") {
    super(message);
    this.name = "BadRequestError";
    this.status = 400;
    this.type = "invalid_request_error";
    this.code = code;
  }
}

export class ModelNotFoundError extends Error {}

export class UpstreamAuthFailedError extends Error {
  status: number;
  type: string;
  code: string;
  constructor(message: string, code = "upstream_auth_failed") {
    super(message);
    this.name = "UpstreamAuthFailedError";
    this.status = 502;
    this.type = "upstream_auth_failed";
    this.code = code;
  }
}
