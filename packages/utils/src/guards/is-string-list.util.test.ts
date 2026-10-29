import { describe, expect, it } from 'vite-plus/test';

import { isStringList } from './is-string-list.util';

describe('isStringList', () => {
  it('accepts an array whose every member is a string', () => {
    expect(isStringList(['a', ''])).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(isStringList([])).toBe(true);
  });

  it('rejects an array holding a non-string member', () => {
    expect(isStringList(['a', 1])).toBe(false);
  });

  it('rejects a value that is not an array', () => {
    expect(isStringList('a')).toBe(false);
    expect(isStringList({ 0: 'a', length: 1 })).toBe(false);
    expect(isStringList(undefined)).toBe(false);
  });
});
