import { describe, expect, it } from 'vite-plus/test';

import { toUrlWriteOnly } from './toUrlWriteOnly.util';

describe('toUrlWriteOnly', () => {
  it('keeps the URL half of an entry that carries both', () => {
    expect(
      toUrlWriteOnly({
        persistenceKey: 'rows',
        searchParamKey: 'filters',
        searchParamValue: '{"status":"open"}',
        slice: 'columnFilters',
        valueSlice: { status: 'open' },
      }),
    ).toEqual({
      searchParamKey: 'filters',
      searchParamValue: '{"status":"open"}',
    });
  });

  it('leaves a URL-only entry alone', () => {
    expect(
      toUrlWriteOnly({ searchParamKey: 'sorting', searchParamValue: '' }),
    ).toEqual({ searchParamKey: 'sorting', searchParamValue: '' });
  });

  it('omits a value the entry did not carry, rather than writing an empty one', () => {
    expect(toUrlWriteOnly({ searchParamKey: 'filters' })).toEqual({
      searchParamKey: 'filters',
    });
  });

  it('strips a slice-only entry to nothing writable', () => {
    expect(
      toUrlWriteOnly({
        persistenceKey: 'rows',
        slice: 'columnOrder',
        valueSlice: ['id'],
      }),
    ).toEqual({ searchParamKey: undefined });
  });
});
