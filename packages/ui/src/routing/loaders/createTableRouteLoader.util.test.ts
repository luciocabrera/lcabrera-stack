import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';

import { serializeSortingToURL } from '#ui/utils/urlState';

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

  it('gives one loader a fresh dataPromise per navigation, which is what re-suspends', () => {
    // The remount nothing keys by hand: a navigation re-runs *the same* loader,
    // so `TableDataResolver`'s `use()` gets a promise it has not seen and
    // suspends again. Building two loaders would prove nothing — their promises
    // differ whatever this function does — so one loader is invoked twice.
    const sortingParam = serializeSortingToURL<Row>([
      { columnKey: 'name', direction: 'asc' },
    ]);
    const fetchPage = vi.fn(async () => response);
    const loader = createTableRouteLoader<Row, typeof response>({
      ...baseConfig,
      fetchPage,
    });

    const first = loader({
      request: new Request('http://localhost/rows'),
    } as LoaderFunctionArgs);
    const second = loader({
      request: new Request(
        `http://localhost/rows?sorting=${encodeURIComponent(sortingParam ?? '')}`,
      ),
    } as LoaderFunctionArgs);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(first.dataPromise).not.toBe(second.dataPromise);
  });

  it('returns only the fields its consumers read', () => {
    // `key` used to be returned here with a comment claiming React Router
    // remounted the boundary from it. Nothing read it, and React Router reads
    // no loader field by that name — so the exact set is pinned rather than
    // left to grow another unconsumed member.
    expect(
      Object.keys(invoke().result).toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(['columnsState', 'dataPromise', 'metaState']);
  });
});
