import { describe, expect, it } from 'vite-plus/test';

import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

import { resolvePersistenceEntries } from './resolvePersistenceEntries.util';

const BOTH: TablePersistenceEntry = {
  persistenceKey: 'rows',
  searchParamKey: 'filters',
  searchParamValue: '{"status":"open"}',
  slice: 'columnFilters',
  valueSlice: { status: 'open' },
};

const SLICE_ONLY: TablePersistenceEntry = {
  persistenceKey: 'rows',
  slice: 'columnOrder',
  valueSlice: ['id'],
};

const URL_ONLY: TablePersistenceEntry = {
  searchParamKey: 'sorting',
  searchParamValue: '{"id":"asc"}',
};

describe('resolvePersistenceEntries', () => {
  it('writes every entry as given on an ordinary table', () => {
    const entries = [BOTH, SLICE_ONLY, URL_ONLY];

    expect(resolvePersistenceEntries({ entries })).toEqual(entries);
  });

  it('drops a slice-only entry on a transient layout', () => {
    expect(
      resolvePersistenceEntries({
        entries: [SLICE_ONLY],
        isColumnLayoutTransient: true,
      }),
    ).toEqual([]);
  });

  it('keeps the URL half of an entry that carries both', () => {
    expect(
      resolvePersistenceEntries({
        entries: [BOTH],
        isColumnLayoutTransient: true,
      }),
    ).toEqual([
      { searchParamKey: 'filters', searchParamValue: '{"status":"open"}' },
    ]);
  });

  it('leaves a URL-only entry untouched', () => {
    expect(
      resolvePersistenceEntries({
        entries: [URL_ONLY],
        isColumnLayoutTransient: true,
      }),
    ).toEqual([URL_ONLY]);
  });

  it('preserves the order the caller gave', () => {
    expect(
      resolvePersistenceEntries({
        entries: [URL_ONLY, SLICE_ONLY, BOTH],
        isColumnLayoutTransient: true,
      }).map((entry) => entry.searchParamKey),
    ).toEqual(['sorting', 'filters']);
  });
});
