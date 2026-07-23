import { expect, it } from 'vite-plus/test';

import { safeJsonParse } from './safe-json-parse.util';

it('parses valid JSON', () => {
  expect(safeJsonParse('{"a":1}')).toStrictEqual({ a: 1 });
});

it('returns undefined for null or empty input', () => {
  // `URLSearchParams.get` returns null for a missing key (no null literal).
  expect(safeJsonParse(new URLSearchParams().get('missing'))).toBeUndefined();
  expect(safeJsonParse('')).toBeUndefined();
});

it('returns undefined for malformed JSON instead of throwing', () => {
  expect(safeJsonParse('{not json')).toBeUndefined();
});
