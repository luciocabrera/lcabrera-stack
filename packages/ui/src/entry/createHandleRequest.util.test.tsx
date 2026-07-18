import type { ReactNode } from 'react';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import type { EntryContext } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

// Capture what `renderToPipeableStream` is called with so the tests can drive
// the streaming callbacks directly — the real streaming render needs a fully
// built router context and is exercised by each app's e2e/manual verification.
const streamHarness = vi.hoisted(() => ({
  abort: vi.fn(),
  options: undefined as RenderToPipeableStreamOptions | undefined,
  pipe: vi.fn(),
}));

vi.mock('react-dom/server', () => ({
  // Positional args match React's renderToPipeableStream(element, options)
  // contract; the element is ignored because the ServerRouter tree is never
  // rendered — this mock replaces the renderer entirely.
  renderToPipeableStream: vi.fn(
    (...args: readonly [ReactNode, RenderToPipeableStreamOptions]) => {
      streamHarness.options = args[1];

      return { abort: streamHarness.abort, pipe: streamHarness.pipe };
    },
  ),
}));

import { createHandleRequest } from './createHandleRequest.util';

// A HEAD request short-circuits before routerContext is ever read, so an
// empty stub is sufficient for that test. The streaming tests only read
// `routerContext.isSpaMode`, so a narrow stub covers them too.
const stubRouterContext = (isSpaMode = false) =>
  ({ isSpaMode }) as EntryContext;

const streamedRequest = (userAgent?: string) =>
  new Request('https://example.test/', {
    headers: userAgent ? { 'user-agent': userAgent } : {},
  });

afterEach(() => {
  streamHarness.abort.mockClear();
  streamHarness.pipe.mockClear();
  streamHarness.options = undefined;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('createHandleRequest', () => {
  it('returns the configured streamTimeout alongside handleRequest', () => {
    const { streamTimeout } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    expect(typeof streamTimeout).toBe('number');
  });

  it('short-circuits HEAD requests without touching routerContext, echoing status and headers', async () => {
    const { handleRequest } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    const request = new Request('https://example.test/', { method: 'HEAD' });
    const responseHeaders = new Headers({ 'X-Test': 'yes' });

    const response = await handleRequest(
      request,
      204,
      responseHeaders,
      stubRouterContext(),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('X-Test')).toBe('yes');
    expect(await response.text()).toBe('');
    // The stream renderer must never run for a HEAD request.
    expect(streamHarness.options).toBeUndefined();
  });

  it('waits for the shell (onShellReady) for a normal browser request and streams an html Response with the preload header', async () => {
    const { handleRequest } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    const responseHeaders = new Headers();
    const responsePromise = handleRequest(
      streamedRequest('Mozilla/5.0 (a normal browser)'),
      200,
      responseHeaders,
      stubRouterContext(),
    );

    const options = streamHarness.options;

    // A non-bot, non-SPA request registers the shell-ready callback, not the
    // all-ready one.
    expect(typeof options?.onShellReady).toBe('function');
    expect(options?.onAllReady).toBeUndefined();

    options?.onShellReady?.();

    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(response.headers.get('Link')).toBe(
      '</stylex.css>; rel=preload; as=style',
    );
    expect(streamHarness.pipe).toHaveBeenCalledTimes(1);
  });

  it('waits for all content (onAllReady) when the user agent is a bot', () => {
    const { handleRequest } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    void handleRequest(
      streamedRequest('Googlebot/2.1 (+http://www.google.com/bot.html)'),
      200,
      new Headers(),
      stubRouterContext(),
    );

    expect(typeof streamHarness.options?.onAllReady).toBe('function');
    expect(streamHarness.options?.onShellReady).toBeUndefined();
  });

  it('waits for all content (onAllReady) in SPA mode even for a normal browser', () => {
    const { handleRequest } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    void handleRequest(
      streamedRequest('Mozilla/5.0 (a normal browser)'),
      200,
      new Headers(),
      stubRouterContext(true),
    );

    expect(typeof streamHarness.options?.onAllReady).toBe('function');
  });

  it('bumps the status to 500 on a streaming error and logs only errors thrown after the shell rendered', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => void 0);

    const { handleRequest } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    const responsePromise = handleRequest(
      streamedRequest('Mozilla/5.0 (a normal browser)'),
      200,
      new Headers(),
      stubRouterContext(),
    );

    const options = streamHarness.options;

    // An error before the shell is committed bumps the status but is NOT logged
    // here (it is surfaced through onShellError instead).
    options?.onError?.('early failure', { componentStack: '' });
    expect(consoleError).not.toHaveBeenCalled();

    // Committing the shell resolves the response with the bumped 500 status.
    options?.onShellReady?.();
    const response = await responsePromise;
    expect(response.status).toBe(500);

    // A later error (after the shell rendered) IS logged, normalized to Error.
    options?.onError?.(new Error('late failure'), { componentStack: '' });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  it('rejects the response when the shell itself fails to render (onShellError)', async () => {
    const { handleRequest } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    const responsePromise = handleRequest(
      streamedRequest('Mozilla/5.0 (a normal browser)'),
      200,
      new Headers(),
      stubRouterContext(),
    );

    streamHarness.options?.onShellError?.('shell exploded');

    await expect(responsePromise).rejects.toThrow('shell exploded');
  });

  it('aborts the render once the abort timeout elapses', () => {
    vi.useFakeTimers();

    const { handleRequest, streamTimeout } = createHandleRequest({
      stylexCssHref: '/stylex.css',
    });

    void handleRequest(
      streamedRequest('Mozilla/5.0 (a normal browser)'),
      200,
      new Headers(),
      stubRouterContext(),
    );

    expect(streamHarness.abort).not.toHaveBeenCalled();

    // abortDelay is streamTimeout + 1000ms.
    vi.advanceTimersByTime(streamTimeout + 1000);

    expect(streamHarness.abort).toHaveBeenCalledTimes(1);
  });
});
