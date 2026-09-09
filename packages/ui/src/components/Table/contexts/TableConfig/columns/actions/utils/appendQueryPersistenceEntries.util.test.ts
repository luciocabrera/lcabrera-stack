import { describe, expect, it } from 'vite-plus/test';

import { appendQueryPersistenceEntries } from './appendQueryPersistenceEntries.util';

const columnEntries = [
  {
    persistenceKey: 'orders',
    slice: 'columnOrder' as const,
    valueSlice: ['id'],
  },
];

const groupingEntry = {
  searchParamKey: 'grouping' as const,
  searchParamValue: '{"keys":["status"]}',
};

describe('appendQueryPersistenceEntries', () => {
  it('returns only column entries when grouping and placement are unchanged', () => {
    expect(
      appendQueryPersistenceEntries({
        columnEntries,
        groupingUpdate: { kind: 'unchanged' },
        hasPlacementChanged: false,
        totalsPlacement: 'last',
      }),
    ).toEqual(columnEntries);
  });

  it('appends the grouping entry when grouping updated', () => {
    expect(
      appendQueryPersistenceEntries({
        columnEntries,
        groupingUpdate: {
          kind: 'updated',
          persistenceEntry: groupingEntry,
        },
        hasPlacementChanged: false,
        totalsPlacement: 'last',
      }),
    ).toEqual([...columnEntries, groupingEntry]);
  });

  it('appends the totals param when placement changed', () => {
    expect(
      appendQueryPersistenceEntries({
        columnEntries,
        groupingUpdate: { kind: 'unchanged' },
        hasPlacementChanged: true,
        totalsPlacement: 'first',
      }),
    ).toEqual([
      ...columnEntries,
      { searchParamKey: 'totals', searchParamValue: 'first' },
    ]);
  });
});
