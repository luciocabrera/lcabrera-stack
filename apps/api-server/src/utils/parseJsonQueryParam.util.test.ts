import { describe, expect, it } from 'vitest';

import { HttpError } from 'api-shared';

import { parseJsonQueryParam } from './parseJsonQueryParam.util';

describe('parseJsonQueryParam', () => {
  it('parses a JSON query string', () => {
    expect(parseJsonQueryParam('{"status":"paid"}')).toEqual({
      status: 'paid',
    });
  });

  it('reads the first array entry before parsing', () => {
    expect(parseJsonQueryParam(['[1,2,3]'])).toEqual([1, 2, 3]);
  });

  it('returns undefined when the query value is missing', () => {
    expect(parseJsonQueryParam(undefined)).toBeUndefined();
  });

  it('throws a HttpError when the JSON is invalid', () => {
    expect(() => parseJsonQueryParam('{bad json}')).toThrow(HttpError);
  });
});
