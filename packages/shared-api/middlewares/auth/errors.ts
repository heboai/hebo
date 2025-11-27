export class AuthError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
