import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import type { EntryContext } from 'react-router';

import { toError } from '@lcabrera/utils/errors/to-error.util';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';

import { getRequestCspNonce } from '#ui/utils/security';

import { addPreloadHeaders } from './addPreloadHeaders.util';
import { buildShellStreamResponse } from './buildShellStreamResponse.util';
import { getStreamTimeout } from './getStreamTimeout.util';

type CreateHandleRequestArgs = {
  readonly stylexCssHref: string;
};

type HandleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) => Promise<Response>;

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

    let statusCode = responseStatusCode;

    const { promise, reject, resolve } = Promise.withResolvers<Response>();

    let isShellRendered = false;
    const userAgent = request.headers.get('user-agent');

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? 'onAllReady'
        : 'onShellReady';

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
