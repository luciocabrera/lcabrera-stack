import { describe, expect, it } from 'vite-plus/test';

import { stripTrailingSlashes } from './stripTrailingSlashes.util.ts';

describe('stripTrailingSlashes', () => {
  it.each([
    { expected: 'https://example.com', input: 'https://example.com' },
    { expected: 'https://example.com', input: 'https://example.com/' },
    { expected: 'https://example.com', input: 'https://example.com///' },
    { expected: 'https://example.com/api', input: 'https://example.com/api/' },
    { expected: '', input: '' },
    { expected: '', input: '///' },
  ])('turns "$input" into "$expected"', ({ expected, input }) => {
    expect(stripTrailingSlashes(input)).toBe(expected);
  });

  it('leaves slashes that are not at the end alone', () => {
    expect(stripTrailingSlashes('https://example.com/a//b')).toBe(
      'https://example.com/a//b',
    );
  });

  it('keeps an astral character intact', () => {
    // Guards the UTF-16 vs code-point choice: a code-point index would cut
    // this string in the middle of the surrogate pair.
    expect(stripTrailingSlashes('https://example.com/🎉/')).toBe(
      'https://example.com/🎉',
    );
  });

  it('scans a long trailing run without pathological slowdown', () => {
    // The input class the old `/\/+$/` backtracked over quadratically.
    const input = `https://example.com${'/'.repeat(50_000)}x`;

    expect(stripTrailingSlashes(input)).toBe(input);
  });
});
