export abstract class ProviderHttpError extends Error {
  status: number;
  type: string;
  code: string;
  constructor(
    message: string,
    opts: { status: number; type: string; code: string },
  ) {
    super(message);
    this.name = new.target.name;
    this.status = opts.status;
    this.type = opts.type;
    this.code = opts.code;
  }
  toJSON() {
    return {
      message: this.message,
      type: this.type,
      param: undefined as unknown,
      code: this.code,
    };
  }
}

export class BadRequestError extends ProviderHttpError {
  constructor(message: string, code = "model_mismatch") {
    super(message, {
      status: 400,
      type: "invalid_request_error",
      code,
    });
  }
}

export class ModelNotFoundError extends ProviderHttpError {
  constructor(message = "Resource not found") {
    super(message, {
      status: 404,
      type: "invalid_request_error",
      code: "not_found",
    });
  }
}

export class UpstreamAuthFailedError extends ProviderHttpError {
  constructor(message: string, code = "upstream_auth_failed") {
    super(message, {
      status: 502,
      type: "upstream_auth_failed",
      code,
    });
  }
}
