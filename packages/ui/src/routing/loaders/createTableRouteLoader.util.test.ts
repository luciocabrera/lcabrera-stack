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

type FetchPageArgs = {
  readonly grouping: readonly string[];
};

const groupingUrl = (param: string) =>
  `http://localhost/rows?grouping=${encodeURIComponent(param)}`;

const invoke = ({
  config = {},
  cookie,
  url = 'http://localhost/rows',
}: {
  readonly config?: Partial<
    Parameters<typeof createTableRouteLoader<Row, typeof response>>[0]
  >;
  readonly cookie?: string;
  readonly url?: string;
} = {}) => {
  // Typed through the generic rather than by an unread parameter, so the
  // argument object the factory passes is typed at the assertion sites below
  // instead of collapsing to `never`.
  const fetchPage = vi.fn<(args: FetchPageArgs) => Promise<typeof response>>(
    async () => response,
  );
  const loader = createTableRouteLoader<Row, typeof response>({
    ...baseConfig,
    fetchPage,
    ...config,
  });
  const request = new Request(url, {
    headers: cookie === undefined ? undefined : { cookie },
  });
  const result = loader({ request } as LoaderFunctionArgs);
  return { fetchPage, result };
};

/**
 * A `-uiFlags` cookie carrying `state`, in the versioned envelope the table's
 * persistence writes. `parseVersionedPayload` casts rather than validates, so
 * whatever is put here reaches the loader's `metaUiFlags`.
 */
const uiFlagsCookie = (state: Record<string, unknown>) =>
  `table-state-${baseConfig.appId}-${baseConfig.persistenceKey}-uiFlags=${encodeURIComponent(
    JSON.stringify({ value: state, version: 1 }),
  )}`;

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

  // The UI-flags cookie is client-controlled and is not validated on the way in
  // — `parseVersionedPayload` casts, and the persist-cookie action writes what
  // it is handed. It seeds `metaUiFlags`, which is spread into `metaState`
  // before the route's own `meta`, so without an explicit resolve a route that
  // declares no capability would inherit one from the cookie. A capability
  // decides what the server is asked for, so the cookie must not be able to
  // reach it: absent must mean off whatever the cookie carries (ADR-063).
  describe('capability meta', () => {
    it('ignores capabilities injected through the UI-flags cookie', () => {
      const { result } = invoke({
        cookie: uiFlagsCookie({
          isKeysetEnabled: true,
          isServerFilterEnabled: true,
        }),
      });

      expect(result.metaState.isKeysetEnabled).toBe(false);
      expect(result.metaState.isServerFilterEnabled).toBe(false);
    });

    it('still reads the UI flags the cookie legitimately carries', () => {
      const { result } = invoke({
        cookie: uiFlagsCookie({
          isKeysetEnabled: true,
          isTableSettingsOpen: true,
        }),
      });

      // The guard is capability-scoped, not a wholesale rejection of the cookie.
      expect(result.metaState.isTableSettingsOpen).toBe(true);
      expect(result.metaState.isKeysetEnabled).toBe(false);
    });

    it('takes each capability from the route meta, over any cookie value', () => {
      const { result } = invoke({
        config: { meta: { isKeysetEnabled: true } },
        cookie: uiFlagsCookie({ isServerFilterEnabled: true }),
      });

      expect(result.metaState.isKeysetEnabled).toBe(true);
      expect(result.metaState.isServerFilterEnabled).toBe(false);
    });

    it('defaults every capability off when the route declares no meta', () => {
      const { result } = invoke();

      expect(result.metaState.isGroupingEnabled).toBe(false);
      expect(result.metaState.isKeysetEnabled).toBe(false);
      expect(result.metaState.isServerFilterEnabled).toBe(false);
    });
  });

  // Grouping is the one capability the factory itself acts on: it changes the
  // *first* query, so the flag is what makes the loader read the `grouping`
  // param at all. That is what makes "a route enables grouping by adding a flag
  // to its loader meta" true — everything below is the same loader, the same
  // URL, and only the flag moving.
  describe('grouping', () => {
    it('reads the grouping param and hands the keys to fetchPage', () => {
      const { fetchPage, result } = invoke({
        config: { meta: { isGroupingEnabled: true } },
        url: groupingUrl('{"keys":["status"]}'),
      });

      expect(fetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ grouping: ['status'] }),
      );
      expect(result.metaState.groupingKeys).toEqual(['status']);
    });

    it('ignores the same param entirely when the route declares no flag', () => {
      // Same URL, same columns, same everything but the one flag — so this
      // isolates the flag rather than merely observing an ungrouped default.
      const { fetchPage, result } = invoke({
        url: groupingUrl('{"keys":["status"]}'),
      });

      expect(fetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ grouping: [] }),
      );
      expect(result.metaState.groupingKeys).toEqual([]);
      expect(result.metaState.isGroupingEnabled).toBe(false);
    });

    it('cannot be switched on by the UI-flags cookie', () => {
      const { fetchPage, result } = invoke({
        cookie: uiFlagsCookie({ isGroupingEnabled: true }),
        url: groupingUrl('{"keys":["status"]}'),
      });

      expect(result.metaState.isGroupingEnabled).toBe(false);
      expect(fetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ grouping: [] }),
      );
    });

    it('cannot have its applied keys forged through the UI-flags cookie', () => {
      // `groupingKeys` is request-derived, so it is spread unconditionally for
      // the same reason the capability flags are: the cookie is client-written
      // and validated nowhere.
      const { result } = invoke({
        config: { meta: { isGroupingEnabled: true } },
        cookie: uiFlagsCookie({ groupingKeys: ['status'] }),
      });

      expect(result.metaState.groupingKeys).toEqual([]);
    });

    it('degrades a malformed grouping param to grouping off', () => {
      for (const param of [
        '{not-json',
        '{"keys":[7]}',
        '{"keys":"status"}',
        '["status"]',
        '{"keys":["status"],"mode":"rollup"}',
      ]) {
        const { fetchPage, result } = invoke({
          config: { meta: { isGroupingEnabled: true } },
          url: groupingUrl(param),
        });

        expect(result.metaState.groupingKeys).toEqual([]);
        expect(fetchPage).toHaveBeenCalledWith(
          expect.objectContaining({ grouping: [] }),
        );
      }
    });

    it('degrades a hand-edited key that names no column to grouping off', () => {
      const { fetchPage, result } = invoke({
        config: { meta: { isGroupingEnabled: true } },
        url: groupingUrl('{"keys":["status; DROP TABLE rows"]}'),
      });

      expect(result.metaState.groupingKeys).toEqual([]);
      expect(fetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ grouping: [] }),
      );
    });

    it('refuses the whole key list when one key is unusable', () => {
      const { result } = invoke({
        config: { meta: { isGroupingEnabled: true } },
        url: groupingUrl('{"keys":["status","nope"]}'),
      });

      expect(result.metaState.groupingKeys).toEqual([]);
    });

    it('leaves the returned key set unchanged for a grouped route', () => {
      // The loader data type is inferred structurally, so a field appearing
      // only when a route groups would change it for every table route at once.
      const { result } = invoke({
        config: { meta: { isGroupingEnabled: true } },
        url: groupingUrl('{"keys":["status"]}'),
      });
      const returnedKeys = Object.keys(result);

      expect(returnedKeys.toSorted((a, b) => a.localeCompare(b))).toEqual([
        'columnsState',
        'dataPromise',
        'metaState',
      ]);
    });

    it('hands ungrouped routes the same fetchPage argument keys as grouped ones', () => {
      const { fetchPage: ungrouped } = invoke();
      const { fetchPage: grouped } = invoke({
        config: { meta: { isGroupingEnabled: true } },
        url: groupingUrl('{"keys":["status"]}'),
      });

      const keysOf = (mock: typeof ungrouped) =>
        Object.keys(mock.mock.calls[0]?.[0] ?? {}).toSorted((a, b) =>
          a.localeCompare(b),
        );

      expect(keysOf(ungrouped)).toEqual([
        'effectiveSorting',
        'filters',
        'grouping',
        'request',
      ]);
      expect(keysOf(grouped)).toEqual(keysOf(ungrouped));
    });
  });
});
