import { describe, expect, it } from 'vite-plus/test';

import { resolveLoaderTotalsPlacement } from './resolveLoaderTotalsPlacement.util';

/**
 * What `URLSearchParams.get` answers for a param the URL does not carry — read
 * from the API rather than written as a literal, so the fixture is the value
 * the loader actually receives rather than a stand-in for it.
 */
const ABSENT_PARAM = new URLSearchParams().get('totals');

describe('resolveLoaderTotalsPlacement', () => {
  it('takes the param over the persisted preference', () => {
    // A link is an explicit statement about one table; the cookie is a standing
    // preference. So a shared link opens the way its author saw it.
    expect(
      resolveLoaderTotalsPlacement({ param: 'first', persisted: 'last' }),
    ).toBe('first');
  });

  it('falls back to the cookie when the URL says nothing', () => {
    expect(
      resolveLoaderTotalsPlacement({ param: ABSENT_PARAM, persisted: 'first' }),
    ).toBe('first');
  });

  it('defaults to last when neither channel carries one', () => {
    expect(
      resolveLoaderTotalsPlacement({
        param: ABSENT_PARAM,
        persisted: undefined,
      }),
    ).toBe('last');
  });

  it('refuses a param outside the vocabulary rather than passing it on', () => {
    // It reaches the direction of a `GROUPING()` term in the emitted ORDER BY,
    // and the param is whatever the URL says.
    expect(
      resolveLoaderTotalsPlacement({ param: 'sideways', persisted: undefined }),
    ).toBe('last');
  });

  it('refuses a cookie-shaped value outside the vocabulary too', () => {
    // The persisted payload is cast rather than validated, so this key can hold
    // anything at all by the time it arrives.
    const persisted = JSON.parse('"DESC"') as never;

    expect(
      resolveLoaderTotalsPlacement({ param: ABSENT_PARAM, persisted }),
    ).toBe('last');
  });
});
