import { describe, expect, it } from 'vitest';

import { isPersistCookieAction } from './isPersistCookieAction.util';

describe('isPersistCookieAction', () => {
  it('returns true for the exact persist-cookie path', () => {
    expect(isPersistCookieAction('/_action/persist-cookie')).toBe(true);
  });

  it('returns true for an absolute URL ending with the persist-cookie path', () => {
    expect(
      isPersistCookieAction('https://example.com/_action/persist-cookie'),
    ).toBe(true);
  });

  it('returns false for an unrelated action path', () => {
    expect(isPersistCookieAction('/_action/something-else')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPersistCookieAction(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPersistCookieAction(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isPersistCookieAction('')).toBe(false);
  });

  it('returns false for a URL that only contains the path as a substring (not suffix)', () => {
    expect(isPersistCookieAction('/_action/persist-cookie/extra')).toBe(false);
  });
});
