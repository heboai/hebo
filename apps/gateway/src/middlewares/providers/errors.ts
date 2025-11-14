export abstract class ProvidersHttpError extends Error {
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
      param: undefined,
      code: this.code,
    };
  }
}

export class BadRequestError extends ProvidersHttpError {
  constructor(message: string, code = "model_mismatch") {
    super(message, {
      status: 400,
      type: "invalid_request_error",
      code,
    });
  }
}

export class ModelNotFoundError extends ProvidersHttpError {
  constructor(message = "Resource not found") {
    super(message, {
      status: 404,
      type: "invalid_request_error",
      code: "not_found",
    });
  }
}
