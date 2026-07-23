import type { TableColumn } from '@lcabrera/ui/components/Table';
import type { LoaderFunctionArgs } from 'react-router';

import { serializeSortingToURL } from '@lcabrera/ui/utils/urlState';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createTableRouteLoader } from './createTableRouteLoader.util';

type Row = {
  readonly id: number;
  readonly name: string;
  readonly status: string;
};

const columns: TableColumn<Row>[] = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
  {
    dataType: 'string',
    filterOptionsDescriptor: { kind: 'static', values: ['Open', 'Closed'] },
    key: 'status',
    label: 'Status',
  },
];

const baseConfig = {
  appId: 'test-app',
  columns,
  persistenceKey: 'rows',
  schemaName: 'public',
  tableName: 'rows',
  title: { plural: 'Rows', singular: 'Row' },
} as const;

const response = { data: [], total: 0 };

const invoke = ({
  config = {},
  url = 'http://localhost/rows',
}: {
  readonly config?: Partial<
    Parameters<typeof createTableRouteLoader<Row, typeof response>>[0]
  >;
  readonly url?: string;
} = {}) => {
  const fetchPage = vi.fn(async () => response);
  const loader = createTableRouteLoader<Row, typeof response>({
    ...baseConfig,
    fetchPage,
    ...config,
  });
  const result = loader({ request: new Request(url) } as LoaderFunctionArgs);
  return { fetchPage, result };
};

type CollectFunctionPathsArgs = {
  readonly path?: string;
  readonly value: unknown;
};

const collectFunctionPaths = ({
  path = '$',
  value,
}: CollectFunctionPathsArgs): readonly string[] => {
  if (typeof value === 'function') return [path];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectFunctionPaths({ path: `${path}[${index}]`, value: item }),
    );
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectFunctionPaths({ path: `${path}.${key}`, value: entry }),
    );
  }
  return [];
};

describe('createTableRouteLoader', () => {
  it('returns fully serializable columnsState and metaState (no functions cross the loader boundary)', () => {
    const { result } = invoke({
      config: { filterOptions: { transport: 'loader' } },
    });

    expect(collectFunctionPaths({ value: result.columnsState })).toEqual([]);
    expect(collectFunctionPaths({ value: result.metaState })).toEqual([]);
  });

  it('bakes distinct descriptors onto filterable string columns when filterOptions is set', () => {
    const { result } = invoke({
      config: { filterOptions: { transport: 'loader' } },
    });

    const name = result.columnsState.columns.find(
      (column) => column.key === 'name',
    );
    expect(name?.filterOptionsDescriptor).toEqual({
      kind: 'distinct',
      params: { columnName: 'name', schemaName: 'public', tableName: 'rows' },
      transport: 'loader',
    });
    // A pre-described (static enum) column keeps its own descriptor.
    const status = result.columnsState.columns.find(
      (column) => column.key === 'status',
    );
    expect(status?.filterOptionsDescriptor).toEqual({
      kind: 'static',
      values: ['Open', 'Closed'],
    });
  });

  it('leaves columns untouched when filterOptions is omitted', () => {
    const { result } = invoke();

    expect(result.columnsState.columns).toBe(columns);
  });

  it('merges base meta, conditional schemaName, and route meta extras', () => {
    const { result } = invoke({
      config: {
        meta: {
          crud: { create: true, delete: true, read: true, update: true },
        },
      },
    });

    expect(result.metaState).toMatchObject({
      appId: 'test-app',
      crud: { create: true, delete: true, read: true, update: true },
      persistenceKey: 'rows',
      schemaName: 'public',
      tableName: 'rows',
      title: { plural: 'Rows', singular: 'Row' },
    });
  });

  it('omits schemaName from metaState when not provided', () => {
    const { result } = invoke({ config: { schemaName: undefined } });

    expect('schemaName' in result.metaState).toBe(false);
  });

  it('appends the primary-key tiebreaker to the sort passed to fetchPage, but keeps columnsState.sorting user-only', () => {
    const sortingParam = serializeSortingToURL<Row>([
      { columnKey: 'name', direction: 'desc' },
    ]);
    const { fetchPage, result } = invoke({
      url: `http://localhost/rows?sorting=${encodeURIComponent(sortingParam ?? '')}`,
    });

    // columnsState keeps only the user's sorting.
    expect(result.columnsState.sorting).toEqual([
      { columnKey: 'name', direction: 'desc' },
    ]);
    // fetchPage receives the primary-key tiebreaker appended (ADR-008).
    expect(fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveSorting: [
          { columnKey: 'name', direction: 'desc' },
          { columnKey: 'id', direction: 'asc' },
        ],
      }),
    );
  });

  it('passes fetchPage its promise straight through as dataPromise (unawaited)', () => {
    const { fetchPage, result } = invoke();

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result.dataPromise).toBe(fetchPage.mock.results[0]?.value);
  });

  it('derives the remount key from the sort and filter URL params', () => {
    const empty = invoke();
    expect(empty.result.key).toBe('');

    const sortingParam = serializeSortingToURL<Row>([
      { columnKey: 'name', direction: 'asc' },
    ]);
    const withSort = invoke({
      url: `http://localhost/rows?sorting=${encodeURIComponent(sortingParam ?? '')}`,
    });
    expect(withSort.result.key).toBe(sortingParam);
  });
});
