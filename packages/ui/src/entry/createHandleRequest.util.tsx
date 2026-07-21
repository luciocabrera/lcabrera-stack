import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import type { EntryContext } from 'react-router';

import { getRequestCspNonce } from '@lcabrera/ui/utils/security';
import { toError } from '@lcabrera/utils/errors/to-error.util';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';

import { addPreloadHeaders } from './addPreloadHeaders.util';
import { buildShellStreamResponse } from './buildShellStreamResponse.util';
import { getStreamTimeout } from './getStreamTimeout.util';

type CreateHandleRequestArgs = {
  /** The app's own compiled StyleX stylesheet URL (`import stylexCssHref from './stylex.css?url'`) — a per-app build artifact, cannot be sourced from this package. */
  readonly stylexCssHref: string;
};

// Positional signature is React Router's entry.server contract — status code
// second, headers third. Do not reorder (or alphabetize) these parameters.
type HandleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) => Promise<Response>;

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
}: CreateHandleRequestArgs) => {
  const streamTimeout = getStreamTimeout();
  const abortDelay = streamTimeout + 1000;

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
    addPreloadHeaders({ responseHeaders, stylexCssHref });

    // A render error after the shell is committed bumps the status to 500 —
    // tracked in a local (noParameterAssign) rather than mutating the param.
    let statusCode = responseStatusCode;

    const { promise, reject, resolve } = Promise.withResolvers<Response>();

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

    const clearRenderTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    };

    const { abort, pipe } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        nonce: cspNonce,
        onError(error: unknown) {
          statusCode = 500;
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

          resolve(
            buildShellStreamResponse({
              clearRenderTimeout,
              pipe,
              responseHeaders,
              responseStatusCode: statusCode,
            }),
          );
        },
      },
    );

    return promise;
  };

  return { handleRequest, streamTimeout };
};
