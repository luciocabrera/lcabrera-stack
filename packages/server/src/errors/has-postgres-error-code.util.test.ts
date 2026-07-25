import { describe, expect, it } from 'vite-plus/test';

import { hasPostgresErrorCode } from './has-postgres-error-code.util.ts';

const pgError = (code: string) => Object.assign(new Error('boom'), { code });

describe('hasPostgresErrorCode', () => {
  it('matches an Error carrying the requested SQLSTATE', () => {
    expect(
      hasPostgresErrorCode({ code: '23505', error: pgError('23505') }),
    ).toBe(true);
  });

  it('rejects an Error carrying a different SQLSTATE', () => {
    expect(
      hasPostgresErrorCode({ code: '23505', error: pgError('23503') }),
    ).toBe(false);
  });

  it('rejects an Error with no code at all', () => {
    expect(hasPostgresErrorCode({ code: '23505', error: new Error('x') })).toBe(
      false,
    );
  });

  it('rejects a non-Error rejection that merely has the code', () => {
    expect(
      hasPostgresErrorCode({ code: '23505', error: { code: '23505' } }),
    ).toBe(false);
  });

  it('rejects nullish and primitive rejections', () => {
    expect(hasPostgresErrorCode({ code: '23505', error: undefined })).toBe(
      false,
    );
    expect(hasPostgresErrorCode({ code: '23505', error: '23505' })).toBe(false);
  });

  it('compares as a string, so a numeric code does not match', () => {
    const numericCoded = Object.assign(new Error('boom'), { code: 23_505 });

    expect(hasPostgresErrorCode({ code: '23505', error: numericCoded })).toBe(
      false,
    );
  });
});
