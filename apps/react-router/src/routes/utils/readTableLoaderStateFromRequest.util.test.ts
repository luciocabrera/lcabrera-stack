import { describe, expect, it, vi } from 'vitest';

import type { TableColumn } from '@/components/Table';

vi.mock('@/components/Table/utils', () => ({
  readPersistedStateFromCookie: vi.fn(),
}));

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import { encodeStateToURL } from '@/utils/urlState/encodeStateToURL.util';
import { serializeFiltersToURL } from '@/utils/urlState/serializeFiltersToURL.util';
import { serializeSortingToURL } from '@/utils/urlState/serializeSortingToURL.util';

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

describe('readTableLoaderStateFromRequest', () => {
  it('merges URL state with persisted cookie state', () => {
    vi.mocked(readPersistedStateFromCookie).mockReturnValue({
      columnOrder: ['cookieOnly'],
      columnSizing: { amount: 180 },
      columnVisibility: new Set(['cookieOnly']),
    });

    const encodedState = encodeStateToURL({
      columnOrder: ['id', 'status'],
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
      `https://example.com/orders?orders-tableState=${encodedState}&sorting=${encodeURIComponent(
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
    expect(result.columnPinning).toEqual({});
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
});
