import type { LoaderFunctionArgs } from 'react-router';

import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';
import type {
  FilterOptionsTransport,
  TableColumnGroupingCapability,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { appendPrimaryKeySorting } from '../shared/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '../shared/sanitizeSorting.util';
import { appendDistinctFilterDescriptors } from './appendDistinctFilterDescriptors.util';
import { readTableLoaderStateFromRequest } from './readTableLoaderStateFromRequest.util';
import { resolveTableCapabilityMeta } from './resolveTableCapabilityMeta.util';

/**
 * What a `createTableRouteLoader` loader hands the route component. Derived
 * from the factory rather than restated, so the view side cannot drift from
 * what the loader actually returns — `useTableRoutePage` reads exactly this.
 */
export type TableRouteLoaderData<
  TData extends Record<string, unknown>,
  TResponse,
> = Awaited<
  ReturnType<ReturnType<typeof createTableRouteLoader<TData, TResponse>>>
>;

type CreateTableRouteLoaderArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = {
  readonly appId: string;
  readonly columns: TableColumn<TData>[];
  /**
   * The route's data fetch. Return the promise **unawaited** — the factory
   * hands it straight back as `dataPromise` for Suspense streaming, so the
   * route renders its skeleton immediately.
   */
  readonly fetchPage: (
    args: TableRouteFetchPageArgs<TData>,
  ) => Promise<TResponse>;
  /**
   * When set, filterable string columns without a descriptor get a serializable
   * `kind: 'distinct'` filter-options descriptor baked in (ADR-009). Omit to
   * leave columns untouched (a route with minimal/no distinct filtering).
   */
  readonly filterOptions?: { readonly transport: FilterOptionsTransport };
  readonly includeFilters?: boolean;
  /**
   * Route-specific meta merged over the base (e.g. `crud`, `deleteActionPath`).
   * This is also where a request-shaping capability is declared, and omitting
   * one leaves it off (ADR-063).
   *
   * Every declaration is carried out in `metaState` for the view's load-more to
   * read. Two of them the factory does not act on — `isKeysetEnabled` and
   * `isServerFilterEnabled` shape later pages only, so what the *first* page
   * sends stays the route's own `fetchPage`, which receives `filters`
   * regardless of any flag.
   *
   * `isGroupingEnabled` is the exception, and has to be: grouping changes the
   * **first** query, so the flag is what makes this factory read the `grouping`
   * param at all. Off, the keys it hands `fetchPage` are empty whatever the URL
   * carries — which is what makes the flag the single enablement point rather
   * than one of two.
   */
  readonly meta?: Partial<TableMetaState>;
  readonly persistenceKey: string;
  /**
   * Resolves what each of this route's columns may do in a grouped read, from
   * the database catalogue (ADR-058).
   *
   * It is injected rather than called here because the answer is Node-only —
   * `@lcabrera/server`'s `getColumnGroupingCapabilities` reaches Postgres, and
   * this package is client-safe (ADR-038), so it may not import it. What the
   * factory owns is *when* it runs and *where the answer lands*: only when the
   * route declared `isGroupingEnabled`, and always in the final unconditional
   * meta spread, so a client-controlled cookie can neither trigger it nor
   * substitute for it (ADR-063).
   *
   * It runs concurrently with `fetchPage`, so the added latency is the
   * catalogue query alone rather than a second serialized round trip. Omit it
   * and the aggregate menu simply offers nothing.
   */
  readonly resolveGroupingCapabilities?: () => Promise<
    Readonly<Record<string, TableColumnGroupingCapability>>
  >;
  readonly schemaName?: string;
  readonly tableName: string;
  readonly title: TableMetaState['title'];
};

/**
 * What a route's data fetch receives. The factory has already read and
 * sanitized the request, so a route only has to turn this into its own
 * paginated query. `effectiveSorting` carries the primary-key tiebreaker for
 * stable server pagination (ADR-008); `filters` is sanitized against the
 * route's columns.
 *
 * `grouping` is the sanitized configuration — ordered keys plus the per-column
 * aggregate map — and it is **empty unless the route declared
 * `isGroupingEnabled`**, so a route that never opted in reads an empty one here
 * however the URL is hand-edited, and forwarding it unconditionally is safe.
 */
type TableRouteFetchPageArgs<TData extends Record<string, unknown>> = {
  readonly effectiveSorting: SortingState<TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly grouping: TableGroupingState;
  readonly request: Request;
};

/**
 * Build a table route's `loader` from config plus a `fetchPage` callback — the
 * loader-side counterpart to the generic `persist-cookie.action`. It absorbs
 * the boilerplate every table route repeated: read persisted state from URL +
 * cookies, sanitize sorting, append the primary-key tiebreaker, optionally bake
 * distinct filter descriptors onto the columns, and assemble the serializable
 * `columnsState` / `metaState`. Only the data fetch stays with the route.
 *
 * The returned loader returns `fetchPage`'s promise **unawaited**, preserving
 * Suspense streaming. Everything it returns is serializable — no functions
 * cross the single-fetch boundary (ADR-009).
 *
 * It is `async` only because a grouping-enabled route has one plain value it
 * must resolve before the document can be painted: the catalogue's answer about
 * what each column may do (ADR-058), which shapes a menu rather than a promise
 * a component can suspend on. `fetchPage` is called **before** that await, so
 * the data query and the catalogue query overlap and the added latency is the
 * slower of the two rather than their sum. A route that declares no grouping
 * awaits nothing at all.
 */
export const createTableRouteLoader = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  appId,
  columns,
  fetchPage,
  filterOptions,
  includeFilters = true,
  meta,
  persistenceKey,
  resolveGroupingCapabilities,
  schemaName,
  tableName,
  title,
}: CreateTableRouteLoaderArgs<TData, TResponse>) => {
  const decoratedColumns = filterOptions
    ? appendDistinctFilterDescriptors({
        columns,
        schemaName,
        tableName,
        transport: filterOptions.transport,
      })
    : columns;

  // Resolved once, outside the loader body: it depends only on the route's own
  // declaration, and both the gate below and the meta spread must read the same
  // answer.
  const capabilityMeta = resolveTableCapabilityMeta({ meta });

  return async ({ request }: LoaderFunctionArgs) => {
    const {
      columnOrder,
      columnPinning,
      columnSizing,
      columnVisibility,
      filters,
      grouping,
      metaUiFlags,
      sorting,
    } = readTableLoaderStateFromRequest<TData>({
      appId,
      columns,
      includeFilters,
      includeGrouping: capabilityMeta.isGroupingEnabled,
      persistenceKey,
      request,
    });

    // The store keeps only the user's sorting; the primary-key tiebreaker is
    // appended solely for the server query so pagination is deterministic.
    const sanitizedSorting = sanitizeSorting<TData>(sorting);
    const effectiveSorting = appendPrimaryKeySorting<TData>({
      columns,
      sorting: sanitizedSorting,
    });

    // Started before the await below, so the catalogue query overlaps the data
    // query instead of queueing behind it.
    const dataPromise = fetchPage({
      effectiveSorting,
      filters,
      grouping,
      request,
    });

    const groupingCapabilities =
      resolveGroupingCapabilities && capabilityMeta.isGroupingEnabled
        ? await resolveGroupingCapabilities()
        : {};

    return {
      columnsState: {
        columnFilters: filters,
        columnOrder,
        columnPinning,
        columns: decoratedColumns,
        columnSizing,
        columnVisibility,
        sorting: sanitizedSorting,
      },
      // Returned unawaited for Suspense streaming. A navigation re-runs the
      // loader, so `TableDataResolver`'s `use()` receives a new promise and
      // re-suspends — nothing has to key the boundary by hand.
      dataPromise,
      metaState: {
        ...metaUiFlags,
        appId,
        persistenceKey,
        tableName,
        title,
        ...(schemaName !== undefined && { schemaName }),
        ...meta,
        // Last, and unconditional — all of them. `metaUiFlags` above is read
        // from the client-controlled UI-flags cookie and validated nowhere, so
        // a route that declares no capability would otherwise inherit one from
        // it and start sending a `filter` or `cursor` its endpoint ignores.
        // The three grouping fields ride the same rule: each is
        // request-derived, so a conditional spread would let a stale cookie
        // entry stand in for one — and `groupingCapabilities` is the one that
        // decides which aggregates the menu offers, so a cookie able to seed it
        // would be a cookie able to widen what the client asks for.
        groupingAggregates: grouping.aggregates,
        groupingCapabilities,
        groupingKeys: grouping.keys,
        ...capabilityMeta,
      },
    };
  };
};
