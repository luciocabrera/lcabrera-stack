import { describe, expect, it } from 'vite-plus/test';

import { normalizeText } from './normalizeText.util.ts';

describe('normalizeText', () => {
  it('turns CRLF and lone CR into LF', () => {
    expect(normalizeText('a\r\nb\rc')).toBe('a\nb\nc\n');
  });

  it('drops a leading byte order mark, from text or from bytes', () => {
    expect(normalizeText('﻿a')).toBe('a\n');
    expect(
      normalizeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x0d, 0x0a])),
    ).toBe('a\n');
  });

  it('ends with exactly one newline', () => {
    expect(normalizeText('a')).toBe('a\n');
    expect(normalizeText('a\n\n\n')).toBe('a\n');
    expect(normalizeText('')).toBe('\n');
  });

  it('keeps trailing spaces and indentation', () => {
    expect(normalizeText('  a  \n\tb')).toBe('  a  \n\tb\n');
  });
});
