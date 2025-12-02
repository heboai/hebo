class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AuthError extends HttpError {
  constructor(message: string, code = "auth_error") {
    super(message, 401, code);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code = "bad_request") {
    super(message, 400, code);
  }
}
