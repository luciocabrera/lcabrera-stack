import type { EntryContext } from 'react-router';

import { describe, expect, it } from 'vitest';

import { createHandleRequest } from './createHandleRequest.util';

// A HEAD request short-circuits before routerContext is ever read, so an
// empty stub is sufficient here — the streaming render path (the rest of
// handleRequest) needs a real router context and is exercised by this
// app's own e2e/manual verification rather than a unit test.
const STUB_ROUTER_CONTEXT = {} as EntryContext;

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
      STUB_ROUTER_CONTEXT,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('X-Test')).toBe('yes');
    expect(await response.text()).toBe('');
  });
});
