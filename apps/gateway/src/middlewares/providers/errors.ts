export class BadRequestError extends Error {
  readonly status = 400;
  readonly code: string;

  constructor(message: string, code = "model_mismatch") {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}
