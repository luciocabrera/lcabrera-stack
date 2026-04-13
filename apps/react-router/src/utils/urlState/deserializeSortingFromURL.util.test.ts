import { describe, expect, it } from 'vitest';

import { deserializeSortingFromURL } from './deserializeSortingFromURL.util.ts';

describe('deserializeSortingFromURL', () => {
  it('deserializes a compact sorting object', () => {
    const param = JSON.stringify({ age: 'desc', name: 'asc' });
    const result = deserializeSortingFromURL(param);
    // JSON.parse preserves insertion order: age first, then name
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
});
