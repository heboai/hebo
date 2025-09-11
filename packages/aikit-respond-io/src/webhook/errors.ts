export class WebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookError";
  }
}

export class SignatureVerificationError extends WebhookError {
  constructor(message: string) {
    super(message);
    this.name = "SignatureVerificationError";
  }
}
