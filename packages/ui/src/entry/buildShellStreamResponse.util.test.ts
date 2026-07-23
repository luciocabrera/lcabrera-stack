import type { PassThrough } from 'node:stream';

import { describe, expect, it, vi } from 'vite-plus/test';

import { buildShellStreamResponse } from './buildShellStreamResponse.util';

const pipeEnding =
  (chunk?: string) =>
  (destination: PassThrough): void => {
    destination.end(chunk);
  };

describe('buildShellStreamResponse', () => {
  it('returns a text/html Response echoing status and headers, streaming what the render pipes', async () => {
    const clearRenderTimeout = vi.fn();
    const pipe = pipeEnding('<html>shell</html>');
    const responseHeaders = new Headers({ 'X-Test': 'yes' });

    const response = buildShellStreamResponse({
      clearRenderTimeout,
      pipe,
      responseHeaders,
      responseStatusCode: 201,
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('X-Test')).toBe('yes');
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(await response.text()).toBe('<html>shell</html>');
  });

  it('clears the render timeout when the body stream finishes', async () => {
    const clearRenderTimeout = vi.fn();

    const response = buildShellStreamResponse({
      clearRenderTimeout,
      pipe: pipeEnding(),
      responseHeaders: new Headers(),
      responseStatusCode: 200,
    });

    // Draining the body drives the PassThrough to its final() hook.
    await response.text();

    expect(clearRenderTimeout).toHaveBeenCalledTimes(1);
  });
});
