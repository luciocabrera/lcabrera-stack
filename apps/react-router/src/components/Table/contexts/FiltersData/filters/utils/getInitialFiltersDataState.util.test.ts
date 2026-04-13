import { describe, expect, it } from 'vitest';

import type { TableColumn } from '@/components/Table/Table.types';

import { getInitialFiltersDataState } from './getInitialFiltersDataState.util.ts';

type Row = { id: string; name: string };

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
];

describe('getInitialFiltersDataState', () => {
  it('creates an entry for each column', () => {
    const result = getInitialFiltersDataState({ columns });
    expect('id' in result).toBe(true);
    expect('name' in result).toBe(true);
  });

  it('each entry has default values', () => {
    const result = getInitialFiltersDataState({ columns });
    const entry = result['id'];
    expect(entry?.data).toEqual([]);
    expect(entry?.hasMore).toBe(false);
    expect(entry?.isLoading).toBe(false);
    expect(entry?.isLoadingMore).toBe(false);
    expect(entry?.totalLoadedRows).toBe(0);
    expect(entry?.totalRows).toBe(0);
  });

  it('returns empty object for empty columns', () => {
    const result = getInitialFiltersDataState({ columns: [] });
    expect(Object.keys(result)).toHaveLength(0);
  });
});
