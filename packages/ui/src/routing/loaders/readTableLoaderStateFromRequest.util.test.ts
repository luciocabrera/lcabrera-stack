import { describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';

vi.mock('#ui/components/Table/utils', () => ({
  readPersistedStateFromCookie: vi.fn(),
  readPersistedUiFlagsFromCookie: vi.fn(() => ({})),
}));

import { readPersistedStateFromCookie } from '#ui/components/Table/utils';
import { serializeFiltersToURL } from '#ui/utils/urlState/serializeFiltersToURL.util';
import { serializeSortingToURL } from '#ui/utils/urlState/serializeSortingToURL.util';

import { readTableLoaderStateFromRequest } from './readTableLoaderStateFromRequest.util';

type TestRow = {
  readonly amount: number;
  readonly id: string;
  readonly status: string;
};

const testColumns: readonly TableColumn<TestRow>[] = [
  {
    dataType: 'number',
    key: 'amount',
    label: 'Amount',
  },
  {
    dataType: 'string',
    key: 'status',
    label: 'Status',
  },
];

const groupingRequest = () =>
  new Request(
    `https://example.com/orders?grouping=${encodeURIComponent('{"keys":["status"]}')}`,
  );

const filtersFor = (value: string) =>
  serializeFiltersToURL({
    status: { operator: 'equals', type: 'text', value },
  }) ?? '';

const sortingFor = (columnKey: 'amount' | 'status') =>
  serializeSortingToURL([{ columnKey, direction: 'asc' }]) ?? '';

const nestedRequest = () =>
  new Request(
    `https://example.com/orders/group?${new URLSearchParams({
      filters: filtersFor('list'),
      'nested.filters': filtersFor('nested'),
      'nested.sorting': sortingFor('status'),
      sorting: sortingFor('amount'),
    }).toString()}`,
  );

describe('readTableLoaderStateFromRequest', () => {
  it('merges the URL sorting and filter params with persisted cookie state', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({
      columnOrder: ['id', 'status'],
      columnSizing: { amount: 180 },
      columnVisibility: new Set(['id']),
    });

    const sorting = serializeSortingToURL([
      { columnKey: 'status', direction: 'desc' },
    ]);
    const filters = serializeFiltersToURL({
      status: {
        operator: 'equals',
        type: 'select',
        value: 'paid',
      },
    });
    const request = new Request(
      `https://example.com/orders?sorting=${encodeURIComponent(
        sorting ?? '',
      )}&filters=${encodeURIComponent(filters ?? '')}`,
      {
        headers: {
          Cookie: 'table-state-orders=1',
        },
      },
    );

    const result = readTableLoaderStateFromRequest<TestRow>({
      includeFilters: true,
      persistenceKey: 'orders',
      request,
    });

    expect(vi.mocked(readPersistedStateFromCookie)).toHaveBeenCalledWith({
      cookieString: 'table-state-orders=1',
      persistenceKey: 'orders',
    });
    expect(result.columnOrder).toEqual(['id', 'status']);
    expect(result.columnSizing).toEqual({ amount: 180 });
    expect(result.columnVisibility).toEqual(new Set(['id']));
    expect(result.standaloneSortParam).toBe('{"status":"desc"}');
    expect(result.sorting).toEqual([
      { columnKey: 'status', direction: 'desc' },
    ]);
    expect(result.standaloneFiltersParam).toBe('{"status":["paid"]}');
    expect(result.filters).toEqual({
      status: {
        operator: 'equals',
        type: 'select',
        values: ['paid'],
      },
    });
  });

  it('ignores a hand-written tableState param', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({
      columnOrder: ['cookieOnly'],
      columnVisibility: new Set(['cookieOnly']),
    });

    const handWrittenState = btoa(
      JSON.stringify({
        columnOrder: ['id', 'status'],
        columnVisibility: ['id'],
      }),
    );
    const request = new Request(
      `https://example.com/orders?orders-tableState=${handWrittenState}`,
    );

    const result = readTableLoaderStateFromRequest<TestRow>({
      persistenceKey: 'orders',
      request,
    });

    expect(result.columnOrder).toEqual(['cookieOnly']);
    expect(result.columnVisibility).toEqual(new Set(['cookieOnly']));
  });

  it('skips standalone filters when includeFilters is false', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

    const request = new Request(
      'https://example.com/orders?filters=%7B%22status%22%3A%5B%22eq%22%2C%22paid%22%5D%7D',
    );

    const result = readTableLoaderStateFromRequest<{ readonly status: string }>(
      {
        persistenceKey: 'orders',
        request,
      },
    );

    expect(result.filters).toEqual({});
    expect(result.standaloneFiltersParam).toBeUndefined();
  });

  it('drops filters that do not match the route column data type', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

    const request = new Request(
      'https://example.com/orders?filters=%7B%22status%22%3A%5B%22gt%22%2C100%5D%2C%22amount%22%3A%5B%22gt%22%2C100%5D%7D',
    );

    const result = readTableLoaderStateFromRequest<TestRow>({
      columns: testColumns,
      includeFilters: true,
      persistenceKey: 'orders',
      request,
    });

    expect(result.filters).toEqual({
      amount: {
        operator: 'greaterThan',
        type: 'number',
        value: 100,
      },
    });
  });

  it('falls back to empty defaults when neither URL state nor cookie state is present', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

    const request = new Request('https://example.com/orders');

    const result = readTableLoaderStateFromRequest<TestRow>({
      persistenceKey: 'orders',
      request,
    });

    expect(result.columnOrder).toEqual([]);
    expect(result.columnVisibility).toEqual(new Set());
    expect(result.columnSizing).toEqual({});
    expect(result.columnPinning).toEqual({ left: [], right: [] });
    expect(result.sorting).toEqual([]);
    expect(result.filters).toEqual({});
    expect(result.standaloneSortParam).toBeNull();
    expect(result.standaloneFiltersParam).toBeUndefined();
  });

  it('uses cookie column order when URL state is absent', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({
      columnOrder: ['status', 'amount'],
    });

    const request = new Request('https://example.com/orders');

    const result = readTableLoaderStateFromRequest<TestRow>({
      persistenceKey: 'orders',
      request,
    });

    expect(result.columnOrder).toEqual(['status', 'amount']);
  });

  it('uses cookie column pinning when present', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({
      columnPinning: { left: ['id'], right: [] },
    });

    const request = new Request('https://example.com/orders');

    const result = readTableLoaderStateFromRequest<TestRow>({
      persistenceKey: 'orders',
      request,
    });

    expect(result.columnPinning).toEqual({ left: ['id'], right: [] });
  });

  it('returns unsanitized filters when includeFilters is true but no columns provided', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

    const filters = serializeFiltersToURL({
      status: { operator: 'equals', type: 'select', value: 'active' },
    });
    const request = new Request(
      `https://example.com/orders?filters=${encodeURIComponent(filters ?? '')}`,
    );

    const result = readTableLoaderStateFromRequest<TestRow>({
      includeFilters: true,
      persistenceKey: 'orders',
      request,
    });

    expect(result.filters).toEqual({
      status: { operator: 'equals', type: 'select', values: ['active'] },
    });
    expect(result.standaloneFiltersParam).not.toBeNull();
  });

  it('returns empty filters when includeFilters is true but no filters param in URL', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

    const request = new Request('https://example.com/orders');

    const result = readTableLoaderStateFromRequest<TestRow>({
      includeFilters: true,
      persistenceKey: 'orders',
      request,
    });

    expect(result.filters).toEqual({});
    expect(result.standaloneFiltersParam).toBeNull();
  });

  describe('grouping', () => {
    it('reads and sanitizes the grouping param when the route allows it', () => {
      vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

      const result = readTableLoaderStateFromRequest<TestRow>({
        columns: testColumns,
        includeGrouping: true,
        persistenceKey: 'orders',
        request: groupingRequest(),
      });

      expect(result.grouping).toEqual({
        aggregates: [],
        keys: ['status'],
        mode: 'flat',
        periods: {},
        shares: [],
      });
      expect(result.standaloneGroupingParam).not.toBeNull();
    });

    it('ignores the param entirely when the route did not opt in', () => {
      vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

      const result = readTableLoaderStateFromRequest<TestRow>({
        columns: testColumns,
        persistenceKey: 'orders',
        request: groupingRequest(),
      });

      expect(result.grouping).toEqual({
        aggregates: [],
        keys: [],
        mode: 'flat',
        periods: {},
        shares: [],
      });
      expect(result.standaloneGroupingParam).toBeUndefined();
    });

    it('answers no grouping when the caller passed no columns to check against', () => {
      // Unsanitized keys have no safe consumer — they reach SQL as identifiers
      // — so this is the opposite of the filters branch, which passes values
      // through when it cannot check them.
      vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

      const result = readTableLoaderStateFromRequest<TestRow>({
        includeGrouping: true,
        persistenceKey: 'orders',
        request: groupingRequest(),
      });

      expect(result.grouping).toEqual({
        aggregates: [],
        keys: [],
        mode: 'flat',
        periods: {},
        shares: [],
      });
    });

    it('answers no grouping for a URL that carries no param', () => {
      vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

      const result = readTableLoaderStateFromRequest<TestRow>({
        columns: testColumns,
        includeGrouping: true,
        persistenceKey: 'orders',
        request: new Request('https://example.com/orders'),
      });

      expect(result.grouping).toEqual({
        aggregates: [],
        keys: [],
        mode: 'flat',
        periods: {},
        shares: [],
      });
      expect(result.standaloneGroupingParam).toBeNull();
    });
  });

  describe('a table nested in another route’s URL', () => {
    it('reads its own prefixed params, not the ones belonging to the table it sits over', () => {
      // The half that makes the write side worth doing: without it the nested
      // table writes `nested.filters` and its loader keeps answering from the
      // list's `filters` — the drawer updates and the rows never do.
      const state = readTableLoaderStateFromRequest<TestRow>({
        appId: 'test-app',
        columns: testColumns,
        includeFilters: true,
        isUrlStateNested: true,
        persistenceKey: 'orders',
        request: nestedRequest(),
      });

      expect(state.filters).toStrictEqual({
        status: { operator: 'equals', type: 'text', value: 'nested' },
      });
      expect(state.sorting).toStrictEqual([
        { columnKey: 'status', direction: 'asc' },
      ]);
    });

    it('reads the unprefixed params when it is not nested', () => {
      const state = readTableLoaderStateFromRequest<TestRow>({
        appId: 'test-app',
        columns: testColumns,
        includeFilters: true,
        persistenceKey: 'orders',
        request: nestedRequest(),
      });

      expect(state.filters).toStrictEqual({
        status: { operator: 'equals', type: 'text', value: 'list' },
      });
      expect(state.sorting).toStrictEqual([
        { columnKey: 'amount', direction: 'asc' },
      ]);
    });
  });

  describe('isColumnLayoutTransient', () => {
    it('reads no persisted layout at all', () => {
      vi.mocked(readPersistedStateFromCookie).mockReturnValue({
        columnOrder: ['status', 'amount'],
        columnPinning: { left: ['status'], right: [] },
        columnSizing: { amount: 180 },
        columnVisibility: new Set(['amount']),
      });
      vi.mocked(readPersistedStateFromCookie).mockClear();

      const state = readTableLoaderStateFromRequest<TestRow>({
        columns: testColumns,
        isColumnLayoutTransient: true,
        persistenceKey: 'orders',
        request: new Request('https://example.com/orders/group', {
          headers: { Cookie: 'table-state-orders-columnOrder=whatever' },
        }),
      });

      expect(vi.mocked(readPersistedStateFromCookie)).not.toHaveBeenCalled();
      expect(state.columnOrder).toEqual([]);
      expect(state.columnPinning).toEqual({ left: [], right: [] });
      expect(state.columnSizing).toEqual({});
      expect(state.columnVisibility).toEqual(new Set());
    });

    it('still reads the sorting and filters this request carries', () => {
      vi.mocked(readPersistedStateFromCookie).mockReturnValue({});

      const search = new URLSearchParams({
        filters: filtersFor('list'),
        sorting: sortingFor('amount'),
      });

      const state = readTableLoaderStateFromRequest<TestRow>({
        columns: testColumns,
        includeFilters: true,
        isColumnLayoutTransient: true,
        persistenceKey: 'orders',
        request: new Request(
          `https://example.com/orders/group?${search.toString()}`,
        ),
      });

      expect(state.filters).toStrictEqual({
        status: { operator: 'equals', type: 'text', value: 'list' },
      });
      expect(state.sorting).toStrictEqual([
        { columnKey: 'amount', direction: 'asc' },
      ]);
    });
  });
});
