import { describe, expect, it } from 'vitest';

import { hasPostgresErrorCode } from './hasPostgresErrorCode.util';

const pgError = (code: string) =>
  Object.assign(new Error('db rejected'), { code });

describe('hasPostgresErrorCode', () => {
  it('matches a pg error carrying the code', () => {
    expect(
      hasPostgresErrorCode({ code: '55000', error: pgError('55000') }),
    ).toBe(true);
  });

  it('rejects a pg error with a different code', () => {
    expect(
      hasPostgresErrorCode({ code: '55000', error: pgError('23505') }),
    ).toBe(false);
  });

  it('rejects a plain Error with no code', () => {
    expect(
      hasPostgresErrorCode({ code: '55000', error: new Error('boom') }),
    ).toBe(false);
  });

  it('rejects non-Error values', () => {
    expect(hasPostgresErrorCode({ code: '55000', error: '55000' })).toBe(false);
    expect(hasPostgresErrorCode({ code: '55000', error: undefined })).toBe(
      false,
    );
  });
});
