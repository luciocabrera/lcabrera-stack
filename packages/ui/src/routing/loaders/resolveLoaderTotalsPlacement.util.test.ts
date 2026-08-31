import { describe, expect, it } from 'vite-plus/test';

import { resolveLoaderTotalsPlacement } from './resolveLoaderTotalsPlacement.util';

const ABSENT_PARAM = new URLSearchParams().get('totals');

describe('resolveLoaderTotalsPlacement', () => {
  it('takes the param over the persisted preference', () => {
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
    expect(
      resolveLoaderTotalsPlacement({ param: 'sideways', persisted: undefined }),
    ).toBe('last');
  });

  it('takes the global preference when neither channel carries one', () => {
    expect(
      resolveLoaderTotalsPlacement({
        param: ABSENT_PARAM,
        persisted: undefined,
        preference: 'first',
      }),
    ).toBe('first');
  });

  it('lets the param outrank the global preference', () => {
    expect(
      resolveLoaderTotalsPlacement({
        param: 'last',
        persisted: undefined,
        preference: 'first',
      }),
    ).toBe('last');
  });

  it("lets this table's own cookie outrank the global preference", () => {
    expect(
      resolveLoaderTotalsPlacement({
        param: ABSENT_PARAM,
        persisted: 'last',
        preference: 'first',
      }),
    ).toBe('last');
  });

  it('refuses a preference outside the vocabulary, like the other two', () => {
    const preference = JSON.parse('"above"') as never;

    expect(
      resolveLoaderTotalsPlacement({
        param: ABSENT_PARAM,
        persisted: undefined,
        preference,
      }),
    ).toBe('last');
  });

  it('refuses a cookie-shaped value outside the vocabulary too', () => {
    const persisted = JSON.parse('"DESC"') as never;

    expect(
      resolveLoaderTotalsPlacement({ param: ABSENT_PARAM, persisted }),
    ).toBe('last');
  });
});
