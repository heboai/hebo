export class RespondIoWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RespondIoWebhookError";
  }
}

export class SignatureVerificationError extends RespondIoWebhookError {
  constructor(message: string) {
    super(message);
    this.name = "SignatureVerificationError";
  }
}
