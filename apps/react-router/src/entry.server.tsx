import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import type { EntryContext } from 'react-router';

import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';

import { getRequestCspNonce } from '@/utils/security';

import stylexCssHref from './stylex.css?url';

/**
 * Adds HTTP Link headers for critical CSS preloading.
 * Browsers process these headers before parsing the HTML body,
 * eliminating the critical request chain for CSS resources.
 */
const addPreloadHeaders = (headers: Headers) => {
  headers.append('Link', `<${stylexCssHref}>; rel=preload; as=style`);
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
 * Stream timeout in milliseconds.
 * Configurable via STREAM_TIMEOUT_MS environment variable.
 * Default: 15 seconds (15000ms)
 */
export const streamTimeout = Number(process.env.STREAM_TIMEOUT_MS) || 15_000;

const ABORT_DELAY = streamTimeout + 1000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  // If you have middleware enabled:
  // loadContext: RouterContextProvider
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  }
  const cspNonce = getRequestCspNonce(request);
  addPreloadHeaders(responseHeaders);

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get('user-agent');

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? 'onAllReady'
        : 'onShellReady';

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      ABORT_DELAY,
    );

    const { abort, pipe } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        nonce: cspNonce,
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(toError(error));
          }
        },
        onShellError(error: unknown) {
          reject(toError(error));
        },
        [readyOption]() {
          shellRendered = true;

          const body = new PassThrough({
            final(callback) {
              // Clear the timeout to prevent retaining the closure and memory leak
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          // Increase max listeners to prevent warning with compression middleware
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
}
