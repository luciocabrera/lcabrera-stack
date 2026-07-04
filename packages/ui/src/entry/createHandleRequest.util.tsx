import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import type { EntryContext } from 'react-router';

import { createReadableStreamFromReadable } from '@react-router/node';
import { getRequestCspNonce } from '@repo/ui/utils/security';
import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';

import { getStreamTimeout } from './getStreamTimeout.util';

type CreateHandleRequestArgs = {
  /** The app's own compiled StyleX stylesheet URL (`import stylexCssHref from './stylex.css?url'`) — a per-app build artifact, cannot be sourced from this package. */
  readonly stylexCssHref: string;
};

type HandleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) => Promise<Response>;

type CreateHandleRequestResult = {
  readonly handleRequest: HandleRequest;
  readonly streamTimeout: number;
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object') {
    return new Error(JSON.stringify(error));
  }

  return new Error('Unknown server-side streaming error');
};

/**
 * Builds the `entry.server.tsx` default export every app needs identically
 * (streaming SSR via renderToPipeableStream, bot/SPA-mode full-render
 * detection, abort-on-timeout, HEAD short-circuit, CSP nonce threading,
 * critical-CSS preload header). `stylexCssHref` is the one genuinely
 * per-app value (each app compiles its own stylesheet) and stays a
 * parameter rather than being read inside this package.
 *
 * React Router's own tooling expects `entry.server.tsx` to export a
 * `streamTimeout` constant as a literal named export of that file — this
 * factory returns it alongside `handleRequest` so the caller can re-export
 * it directly: `export const { handleRequest, streamTimeout } = createHandleRequest(...)`.
 */
export const createHandleRequest = ({
  stylexCssHref,
}: CreateHandleRequestArgs): CreateHandleRequestResult => {
  const streamTimeout = getStreamTimeout();
  const abortDelay = streamTimeout + 1000;

  const addPreloadHeaders = (headers: Headers) => {
    headers.append('Link', `<${stylexCssHref}>; rel=preload; as=style`);
  };

  const handleRequest: HandleRequest = (
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
  ) => {
    // https://httpwg.org/specs/rfc9110.html#HEAD
    if (request.method.toUpperCase() === 'HEAD') {
      return Promise.resolve(
        new Response(undefined, {
          headers: responseHeaders,
          status: responseStatusCode,
        }),
      );
    }

    const cspNonce = getRequestCspNonce(request);
    addPreloadHeaders(responseHeaders);

    return new Promise((resolve, reject) => {
      let isShellRendered = false;
      const userAgent = request.headers.get('user-agent');

      // Ensure requests from bots and SPA Mode renders wait for all content
      // to load before responding — see React Router's renderToPipeableStream docs.
      const readyOption: keyof RenderToPipeableStreamOptions =
        (userAgent && isbot(userAgent)) || routerContext.isSpaMode
          ? 'onAllReady'
          : 'onShellReady';

      // Abort the rendering stream after the timeout so it has time to
      // flush down the rejected boundaries.
      let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
        () => abort(),
        abortDelay,
      );

      const { abort, pipe } = renderToPipeableStream(
        <ServerRouter context={routerContext} url={request.url} />,
        {
          nonce: cspNonce,
          onError(error: unknown) {
            responseStatusCode = 500;
            // Log streaming rendering errors from inside the shell. Don't
            // log errors encountered during initial shell rendering since
            // they'll reject and get logged via onShellError.
            if (isShellRendered) {
              console.error(toError(error));
            }
          },
          onShellError(error: unknown) {
            reject(toError(error));
          },
          [readyOption]() {
            isShellRendered = true;

            const body = new PassThrough({
              final(callback) {
                // Clear the timeout to prevent retaining the closure and memory leak.
                clearTimeout(timeoutId);
                timeoutId = undefined;
                callback();
              },
            });
            // Increase max listeners to prevent warning with compression middleware.
            body.setMaxListeners(20);
            const stream = createReadableStreamFromReadable(body);

            responseHeaders.set('Content-Type', 'text/html');

            pipe(body);

            resolve(
              new Response(stream, {
                headers: responseHeaders,
                status: responseStatusCode,
              }),
            );
          },
        },
      );
    });
  };

  return { handleRequest, streamTimeout };
};
