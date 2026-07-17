import { describe, expect, it } from 'vitest';

import { decodeStateFromURL } from './decodeStateFromURL.util';
import { encodeStateToURL } from './encodeStateToURL.util';

describe('decodeStateFromURL', () => {
  it('decodes an encoded state object', () => {
    const state = { sorting: [{ columnKey: 'name', direction: 'asc' }] };
    const encoded = encodeStateToURL(state);
    const result = decodeStateFromURL({ encoded });
    expect(result).toEqual(state);
  });

  it('returns undefined for invalid base64', () => {
    expect(decodeStateFromURL({ encoded: '!!!invalid!!!' })).toBeUndefined();
  });

  it('returns undefined for invalid JSON', () => {
    const invalid = btoa('not json')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
    expect(decodeStateFromURL({ encoded: invalid })).toBeUndefined();
  });

  it('converts specified array keys to Sets', () => {
    const state = { columnVisibility: ['id', 'name'] };
    const encoded = encodeStateToURL(state);
    const result = decodeStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      encoded,
    });
    expect((result!.columnVisibility as Set<string>).has('id')).toBe(true);
  });

  it('skips convertArraysToSets when key is not an array', () => {
    const state = { columnVisibility: 'not-an-array' };
    const encoded = encodeStateToURL(state);
    const result = decodeStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      encoded,
    });
    expect(result?.columnVisibility).toBe('not-an-array');
  });
});
