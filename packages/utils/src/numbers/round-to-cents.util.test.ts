import { expect, it } from 'vite-plus/test';

import { roundToCents } from './round-to-cents.util';

it('leaves a two-decimal amount unchanged', () => {
  expect(roundToCents(12.34)).toBe(12.34);
});

it('rounds a long fraction to two decimals', () => {
  expect(roundToCents(10.126)).toBe(10.13);
  expect(roundToCents(10.124)).toBe(10.12);
});

it('rounds a half-cent up', () => {
  expect(roundToCents(1.005)).toBe(1.01);
});

it('returns 0 for 0', () => {
  expect(roundToCents(0)).toBe(0);
});
