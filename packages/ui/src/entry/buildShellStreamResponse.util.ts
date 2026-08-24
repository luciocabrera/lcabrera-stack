import { createReadableStreamFromReadable } from '@react-router/node';
import { PassThrough } from 'node:stream';

type BuildShellStreamResponseArgs = {
  readonly clearRenderTimeout: () => void;
  readonly pipe: (destination: PassThrough) => void;
  readonly responseHeaders: Headers;
  readonly responseStatusCode: number;
};

export const buildShellStreamResponse = ({
  clearRenderTimeout,
  pipe,
  responseHeaders,
  responseStatusCode,
}: BuildShellStreamResponseArgs) => {
  const body = new PassThrough({
    final(callback) {
      // Clear the timeout to prevent retaining the closure and memory leak.
      clearRenderTimeout();
      callback();
    },
  });
  // Increase max listeners to prevent warning with compression middleware.
  body.setMaxListeners(20);
  const stream = createReadableStreamFromReadable(body);

  responseHeaders.set('Content-Type', 'text/html');

  pipe(body);

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
};
