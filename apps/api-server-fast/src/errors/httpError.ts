type HttpErrorArgs = {
  readonly message: string;
  readonly statusCode?: number;
};

export class HttpError extends Error {
  public readonly statusCode: number;

  public constructor({ message, statusCode = 500 }: HttpErrorArgs) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}
