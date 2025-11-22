export class WebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookError";
  }
}

export class InvalidSignatureError extends WebhookError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSignatureError";
  }
}
