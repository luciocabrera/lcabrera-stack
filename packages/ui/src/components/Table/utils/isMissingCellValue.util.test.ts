import { describe, expect, it } from 'vite-plus/test';

import { isMissingCellValue } from './isMissingCellValue.util';

const JSON_NULL: unknown = JSON.parse('null');

describe('isMissingCellValue', () => {
  it.each([undefined, JSON_NULL, ''])('treats %o as missing', (value) => {
    expect(isMissingCellValue(value)).toBe(true);
  });

  it.each([0, false, ' ', 'a', []])('treats %o as present', (value) => {
    expect(isMissingCellValue(value)).toBe(false);
  });
});
