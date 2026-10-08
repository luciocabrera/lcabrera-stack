import { describe, expect, it } from 'vite-plus/test';

import { quotedEnd } from './quotedEnd.util.ts';

describe('quotedEnd', () => {
  it('ends after the closing quote', () => {
    expect(quotedEnd({ quote: "'", start: 0, text: "'ab' x" })).toBe(4);
  });

  it('reads a doubled quote as part of the text', () => {
    expect(quotedEnd({ quote: '"', start: 0, text: '"a""b" x' })).toBe(6);
  });

  it('runs to the end of an unterminated quote', () => {
    expect(quotedEnd({ quote: "'", start: 2, text: "x 'ab" })).toBe(5);
  });
});
