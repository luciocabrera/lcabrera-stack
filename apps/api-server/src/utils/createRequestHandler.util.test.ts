import { describe, expect, it, vi } from 'vitest';

import { createRequestHandler } from './createRequestHandler.util';

describe('createRequestHandler', () => {
  it('invokes the object-argument handler with the Express args', async () => {
    const next = vi.fn();
    const request = {} as never;
    const response = {} as never;
    const handler = vi.fn();

    createRequestHandler({ handler })(request, response, next);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith({
      next,
      request,
      response,
    });
  });

  it('forwards rejected handler errors to next', async () => {
    const error = new Error('boom');
    const next = vi.fn();
    const handler = vi.fn().mockRejectedValue(error);

    createRequestHandler({ handler })({} as never, {} as never, next);
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(error);
  });
});
