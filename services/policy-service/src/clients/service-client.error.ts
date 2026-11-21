export class ServiceClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly serviceName: string,
  ) {
    super(message);
    this.name = "ServiceClientError";
  }
}