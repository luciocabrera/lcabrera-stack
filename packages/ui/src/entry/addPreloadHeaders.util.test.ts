import { describe, expect, it } from 'vitest';

import { addPreloadHeaders } from './addPreloadHeaders.util';

describe('addPreloadHeaders', () => {
  it('appends a style preload Link header for the stylesheet href', () => {
    const responseHeaders = new Headers();

    addPreloadHeaders({
      responseHeaders,
      stylexCssHref: '/assets/stylex-abc123.css',
    });

    expect(responseHeaders.get('Link')).toBe(
      '</assets/stylex-abc123.css>; rel=preload; as=style',
    );
  });

  it('preserves Link headers that are already present', () => {
    const responseHeaders = new Headers({
      Link: '</fonts/inter.woff2>; rel=preload; as=font',
    });

    addPreloadHeaders({
      responseHeaders,
      stylexCssHref: '/stylex.css',
    });

    expect(responseHeaders.get('Link')).toBe(
      '</fonts/inter.woff2>; rel=preload; as=font, </stylex.css>; rel=preload; as=style',
    );
  });
});
