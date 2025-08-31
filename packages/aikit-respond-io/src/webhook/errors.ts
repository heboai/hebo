export class RespondIoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RespondIoError";
  }
}

export class SignatureVerificationError extends RespondIoError {
  constructor(message: string) {
    super(message);
    this.name = "SignatureVerificationError";
  }
}
