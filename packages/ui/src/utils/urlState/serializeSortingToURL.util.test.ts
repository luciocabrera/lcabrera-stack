import { describe, expect, it } from 'vitest';

import { serializeSortingToURL } from './serializeSortingToURL.util';

// serialize*ToURL returns `string | undefined` (undefined for empty input);
// every case below serializes a non-empty value, so the result is a string.
// The typeof guard narrows it without a non-null assertion (Biome's
// noNonNullAssertion) and throws a clear message if the invariant ever breaks.
const parseSerialized = (result: string | undefined) => {
  if (typeof result !== 'string') {
    throw new TypeError('expected serialize to return a JSON string');
  }
  return JSON.parse(result) as Record<string, unknown>;
};

describe('serializeSortingToURL', () => {
  it('returns undefined for empty sorting', () => {
    expect(serializeSortingToURL([])).toBeUndefined();
  });

  it('serializes a single sort entry', () => {
    const result = serializeSortingToURL([
      { columnKey: 'name', direction: 'asc' },
    ]);
    const parsed = parseSerialized(result);
    expect(parsed.name).toBe('asc');
  });

  it('serializes multiple sort entries', () => {
    const result = serializeSortingToURL([
      { columnKey: 'name', direction: 'asc' },
      { columnKey: 'age', direction: 'desc' },
    ]);
    const parsed = parseSerialized(result);
    expect(parsed.name).toBe('asc');
    expect(parsed.age).toBe('desc');
  });

  it('returns undefined when all entries have undefined direction', () => {
    const result = serializeSortingToURL([
      { columnKey: 'name', direction: undefined },
    ]);
    expect(result).toBeUndefined();
  });
});
