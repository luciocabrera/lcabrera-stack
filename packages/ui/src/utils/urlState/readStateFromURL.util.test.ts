import { describe, expect, it } from 'vite-plus/test';

import { encodeStateToURL } from './encodeStateToURL.util';
import { readStateFromURL } from './readStateFromURL.util';

describe('readStateFromURL', () => {
  it('returns decoded state when param exists', () => {
    const state = { sorting: [{ columnKey: 'name', direction: 'asc' }] };
    const encoded = encodeStateToURL(state);
    const searchParams = new URLSearchParams({ myKey: encoded });
    const result = readStateFromURL({ key: 'myKey', searchParams });
    expect(result).toEqual(state);
  });

  it('returns undefined when param does not exist', () => {
    const searchParams = new URLSearchParams();
    expect(readStateFromURL({ key: 'missing', searchParams })).toBeUndefined();
  });

  it('passes convertArraysToSets to decodeStateFromURL', () => {
    const state = { columnVisibility: ['id', 'name'] };
    const encoded = encodeStateToURL(state);
    const searchParams = new URLSearchParams({ k: encoded });
    const result = readStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      key: 'k',
      searchParams,
    });
    expect(result?.columnVisibility).toBeInstanceOf(Set);
  });
});
