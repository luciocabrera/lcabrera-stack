import { describe, expect, it } from 'vite-plus/test';

import { deserializeSortingFromURL } from './deserializeSortingFromURL.util';

describe('deserializeSortingFromURL', () => {
  it('deserializes a compact sorting object', () => {
    const param = JSON.stringify({ age: 'desc', name: 'asc' });
    const result = deserializeSortingFromURL(param);
    expect(result).toEqual([
      { columnKey: 'age', direction: 'desc' },
      { columnKey: 'name', direction: 'asc' },
    ]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(deserializeSortingFromURL('not-json')).toEqual([]);
  });

  it('returns empty array for empty object', () => {
    const result = deserializeSortingFromURL('{}');
    expect(result).toEqual([]);
  });

  it('drops the whole sort when a direction is hand-edited', () => {
    expect(
      deserializeSortingFromURL('{"name":"asc","age":"; DROP TABLE"}'),
    ).toEqual([]);
  });

  it('drops the whole sort for a direction outside the vocabulary', () => {
    expect(deserializeSortingFromURL('{"name":"ASC"}')).toEqual([]);
    expect(deserializeSortingFromURL('{"name":"descending"}')).toEqual([]);
    expect(deserializeSortingFromURL('{"name":1}')).toEqual([]);
  });

  it('drops the whole sort for a param that is not an object', () => {
    expect(deserializeSortingFromURL('["name","asc"]')).toEqual([]);
    expect(deserializeSortingFromURL('"asc"')).toEqual([]);
  });

  it('degrades rather than throwing on any of the above', () => {
    expect(() =>
      deserializeSortingFromURL('{"name":"sideways"}'),
    ).not.toThrow();
    expect(() => deserializeSortingFromURL('not-json')).not.toThrow();
  });
});
