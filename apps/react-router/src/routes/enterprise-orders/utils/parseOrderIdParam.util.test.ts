import { expect, it } from 'vitest';

import { parseOrderIdParam } from './parseOrderIdParam.util';

it('returns the numeric id for a valid param', () => {
  expect(parseOrderIdParam('7')).toBe(7);
});

it('throws for a missing param', () => {
  expect(() => parseOrderIdParam(undefined)).toThrow();
});

it('throws for a non-numeric param', () => {
  expect(() => parseOrderIdParam('abc')).toThrow();
});

it('throws for a non-positive id', () => {
  expect(() => parseOrderIdParam('0')).toThrow();
  expect(() => parseOrderIdParam('-3')).toThrow();
});
