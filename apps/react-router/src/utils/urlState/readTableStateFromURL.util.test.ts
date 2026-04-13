import { describe, expect, it } from 'vitest';

import { encodeStateToURL } from './encodeStateToURL.util.ts';
import { readTableStateFromURL } from './readTableStateFromURL.util.ts';

describe('readTableStateFromURL', () => {
  it('returns decoded table state', () => {
    const state = { sorting: [{ columnKey: 'name', direction: 'asc' }] };
    const encoded = encodeStateToURL(state);
    const searchParams = new URLSearchParams({ 'myTable-tableState': encoded });
    const result = readTableStateFromURL({
      persistenceKey: 'myTable',
      searchParams,
    });
    expect(result).toEqual(state);
  });

  it('returns undefined when param missing', () => {
    const searchParams = new URLSearchParams();
    expect(
      readTableStateFromURL({ persistenceKey: 'myTable', searchParams }),
    ).toBeUndefined();
  });

  it('converts columnVisibility array to Set', () => {
    const state = { columnVisibility: ['id', 'name'] };
    const encoded = encodeStateToURL(state);
    const searchParams = new URLSearchParams({ 'myTable-tableState': encoded });
    const result = readTableStateFromURL({
      persistenceKey: 'myTable',
      searchParams,
    });
    expect(result?.columnVisibility).toBeInstanceOf(Set);
  });
});
