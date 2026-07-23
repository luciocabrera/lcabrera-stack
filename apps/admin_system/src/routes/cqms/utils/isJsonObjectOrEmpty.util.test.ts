import { describe, expect, it } from 'vite-plus/test';

import { isJsonObjectOrEmpty } from './isJsonObjectOrEmpty.util';

describe('isJsonObjectOrEmpty', () => {
  it('accepts an empty string, since config detection is optional', () => {
    expect(isJsonObjectOrEmpty('')).toBe(true);
  });

  it('accepts a JSON object', () => {
    expect(isJsonObjectOrEmpty('{"files":["package.json"]}')).toBe(true);
    expect(isJsonObjectOrEmpty('{}')).toBe(true);
  });

  it('rejects unparseable input rather than throwing', () => {
    expect(isJsonObjectOrEmpty('{not json')).toBe(false);
    expect(isJsonObjectOrEmpty(' '.repeat(3))).toBe(false);
  });

  it('rejects JSON scalars and null', () => {
    expect(isJsonObjectOrEmpty('"a string"')).toBe(false);
    expect(isJsonObjectOrEmpty('42')).toBe(false);
    expect(isJsonObjectOrEmpty('true')).toBe(false);
    expect(isJsonObjectOrEmpty('null')).toBe(false);
  });

  it('accepts a JSON array, as the scanner forms always have (the DB rejects it)', () => {
    expect(isJsonObjectOrEmpty('[1,2]')).toBe(true);
  });
});
