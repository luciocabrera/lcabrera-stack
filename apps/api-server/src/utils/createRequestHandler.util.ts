import type { NextFunction, Request, RequestHandler, Response } from 'express';

type RequestHandlerArgs = {
  readonly next: NextFunction;
  readonly request: Request;
  readonly response: Response;
};

type CreateRequestHandlerArgs = {
  readonly handler: (args: RequestHandlerArgs) => Promise<void> | void;
};

/**
 * Adapt object-argument handlers to Express request handlers.
 */
export const createRequestHandler =
  ({ handler }: CreateRequestHandlerArgs): RequestHandler =>
  // eslint-disable-next-line local-rules/destructuring-for-functions
  (request, response, next) => {
    Promise.resolve(handler({ next, request, response })).catch(next);
  };
