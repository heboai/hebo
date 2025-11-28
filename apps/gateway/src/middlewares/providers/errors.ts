export class BadRequestError extends Error {
  readonly status: number;
  readonly type: string;
  readonly code: string;

  constructor(message: string, code = "model_mismatch") {
    super(message);
    this.name = new.target.name;
    this.status = 400;
    this.type = "invalid_request_error";
    this.code = code;
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
