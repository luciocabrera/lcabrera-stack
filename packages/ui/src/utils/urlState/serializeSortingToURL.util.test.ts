import { describe, expect, it } from 'vite-plus/test';

import { serializeSortingToURL } from './serializeSortingToURL.util';

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

  it('keeps a __proto__ column key rather than dropping that one entry', () => {
    const result = serializeSortingToURL([
      { columnKey: '__proto__', direction: 'asc' },
      { columnKey: 'name', direction: 'desc' },
    ]);

    expect(result).toBe('{"__proto__":"asc","name":"desc"}');
  });
});
