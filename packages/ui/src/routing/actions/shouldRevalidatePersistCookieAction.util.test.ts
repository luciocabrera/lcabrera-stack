import type { ShouldRevalidateFunctionArgs } from 'react-router';

import { describe, expect, it } from 'vite-plus/test';

import { shouldRevalidatePersistCookieAction } from './shouldRevalidatePersistCookieAction.util';

type BuildArgs = Partial<ShouldRevalidateFunctionArgs>;

const buildArgs = (overrides: BuildArgs = {}) =>
  ({
    actionResult: undefined,
    actionStatus: undefined,
    currentParams: {},
    currentUrl: new URL('https://example.com/enterprise-orders?page=1'),
    defaultShouldRevalidate: true,
    formAction: undefined,
    formData: undefined,
    formEncType: undefined,
    formMethod: undefined,
    nextParams: {},
    nextUrl: new URL('https://example.com/enterprise-orders?page=1'),
    ...overrides,
  }) as ShouldRevalidateFunctionArgs;

describe('shouldRevalidatePersistCookieAction', () => {
  it('returns false for persist-cookie 204 responses', () => {
    const result = shouldRevalidatePersistCookieAction(
      buildArgs({
        actionStatus: 204,
        formAction: '/_action/persist-cookie',
      }),
    );

    expect(result).toBe(false);
  });

  it('returns false for absolute persist-cookie 204 responses', () => {
    const result = shouldRevalidatePersistCookieAction(
      buildArgs({
        actionStatus: 204,
        formAction: 'https://example.com/_action/persist-cookie',
      }),
    );

    expect(result).toBe(false);
  });

  it('returns default behavior for non-204 persist-cookie responses', () => {
    const result = shouldRevalidatePersistCookieAction(
      buildArgs({
        actionStatus: 302,
        defaultShouldRevalidate: true,
        formAction: '/_action/persist-cookie',
      }),
    );

    expect(result).toBe(true);
  });

  it('returns default behavior for unrelated actions', () => {
    const result = shouldRevalidatePersistCookieAction(
      buildArgs({
        actionStatus: 204,
        defaultShouldRevalidate: true,
        formAction: '/_action/something-else',
      }),
    );

    expect(result).toBe(true);
  });
});
