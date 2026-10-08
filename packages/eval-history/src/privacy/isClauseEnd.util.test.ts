import { describe, expect, it } from 'vite-plus/test';

import { isClauseEnd } from './isClauseEnd.util.ts';

describe('isClauseEnd', () => {
  it.each([
    { token: undefined },
    { token: { kind: 'punctuation', quoted: false, value: ')' } as const },
    { token: { kind: 'identifier', quoted: false, value: 'join' } as const },
  ])('ends a relation at $token', ({ token }) => {
    expect(isClauseEnd(token)).toBe(true);
  });

  it.each([
    { token: { kind: 'identifier', quoted: false, value: 'detail' } as const },
    { token: { kind: 'identifier', quoted: true, value: 'join' } as const },
    { token: { kind: 'operator', quoted: false, value: '*' } as const },
  ])('does not end a relation at $token.value', ({ token }) => {
    expect(isClauseEnd(token)).toBe(false);
  });
});
