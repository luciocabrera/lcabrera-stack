import type { AppLoadContext, EntryContext } from 'react-router';

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
  headers.append(
    'Link',
    `</index.css>; rel=preload; as=style, <${stylexCssHref}>; rel=preload; as=style`,
  );
};

/**
 * Stream timeout in milliseconds.
 * Configurable via STREAM_TIMEOUT_MS environment variable.
 * Default: 15 seconds (15000ms)
 */
export const streamTimeout = Number(process.env.STREAM_TIMEOUT_MS) || 15_000;

const ABORT_DELAY = streamTimeout + 1000;

/**
 * Server-side request handler for React Router 7 streaming.
 * Implements proper Suspense streaming with bot detection.
 *
 * Note: This function signature is required by React Router's server handler.
 */
// eslint-disable-next-line local-rules/destructuring-for-functions -- React Router requires positional parameters
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  const userAgent = request.headers.get('user-agent');

  return userAgent && isbot(userAgent)
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        routerContext,
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        routerContext,
      );
}

// eslint-disable-next-line local-rules/destructuring-for-functions -- Internal helper matching main handler signature
function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const cspNonce = getRequestCspNonce(request);
  addPreloadHeaders(responseHeaders);

  // eslint-disable-next-line local-rules/destructuring-for-functions -- Promise constructor signature is fixed
  return new Promise((resolve, reject) => {
    let isDidError = false;

    const { abort, pipe } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        nonce: cspNonce,
        onAllReady() {
          const body = new PassThrough();
          // Increase max listeners to prevent warning with compression middleware
          body.setMaxListeners(20);

          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: isDidError ? 500 : responseStatusCode,
            }),
          );

          pipe(body);
        },
        onError(error: unknown) {
          isDidError = true;
          console.error('Bot request error:', error);
        },
        onShellError(error: unknown) {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

// eslint-disable-next-line local-rules/destructuring-for-functions -- Internal helper matching main handler signature
function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const cspNonce = getRequestCspNonce(request);
  addPreloadHeaders(responseHeaders);

  // eslint-disable-next-line local-rules/destructuring-for-functions -- Promise constructor signature is fixed
  return new Promise((resolve, reject) => {
    let isDidError = false;

    const { abort, pipe } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        nonce: cspNonce,
        onError(error: unknown) {
          isDidError = true;
          console.error('Streaming error:', error);
        },
        onShellError(error: unknown) {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
        onShellReady() {
          const body = new PassThrough();
          // Increase max listeners to prevent warning with compression middleware
          body.setMaxListeners(20);

          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: isDidError ? 500 : responseStatusCode,
            }),
          );

          pipe(body);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
