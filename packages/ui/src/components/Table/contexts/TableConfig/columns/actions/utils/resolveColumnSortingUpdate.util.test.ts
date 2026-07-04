import { describe, expect, it } from 'vitest';

import { resolveColumnSortingUpdate } from './resolveColumnSortingUpdate.util';

type Row = {
  readonly priority: string;
  readonly status: string;
};

describe('resolveColumnSortingUpdate', () => {
  const columns = [
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
  ] as const;

  it('returns ignored for the actions column', () => {
    const result = resolveColumnSortingUpdate<Row>({
      columns,
      existingSorting: [],
      sort: { columnKey: 'actions', direction: 'asc' },
    });

    expect(result).toEqual({ kind: 'ignored' });
  });

  it('returns unchanged when the direction matches the current sorting', () => {
    const result = resolveColumnSortingUpdate<Row>({
      columns,
      existingSorting: [{ columnKey: 'status', direction: 'asc' }],
      sort: { columnKey: 'status', direction: 'asc' },
    });

    expect(result).toEqual({ kind: 'unchanged' });
  });

  it('returns updated sorting, normalized columns, and persistence entry when sorting changes', () => {
    const result = resolveColumnSortingUpdate<Row>({
      columns,
      existingSorting: [{ columnKey: 'status', direction: 'asc' }],
      sort: { columnKey: 'priority', direction: 'desc' },
    });

    expect(result).toMatchObject({
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'sorting',
        searchParamValue: '{"status":"asc","priority":"desc"}',
      },
      sorting: [
        { columnKey: 'status', direction: 'asc' },
        { columnKey: 'priority', direction: 'desc' },
      ],
    });
  });
});
