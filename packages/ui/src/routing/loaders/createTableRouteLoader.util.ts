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
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { appendPrimaryKeySorting } from '../shared/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '../shared/sanitizeSorting.util';
import { appendDistinctFilterDescriptors } from './appendDistinctFilterDescriptors.util';
import { readTableLoaderStateFromRequest } from './readTableLoaderStateFromRequest.util';
import { resolveTableCapabilityMeta } from './resolveTableCapabilityMeta.util';

/**
 * Derived from the factory rather than restated, so the view side cannot drift from what
 * the loader actually returns — `useTableRoutePage` reads exactly this.
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
   * The grouping this route applies when the URL carries no `grouping` param — a curated
   * starting point rather than a free-form picker's empty state (#578).
   * It is read only where the route also declared `isGroupingEnabled`, for the same reason
   * the param is: a default on a route that cannot group would ask its endpoint for a shape
   * it does not produce.
   */
  readonly defaultGrouping?: TableGroupingState;
  /**
   * Return the promise **unawaited** — the factory hands it straight back as `dataPromise`
   * for Suspense streaming, so the route renders its skeleton immediately.
   */
  readonly fetchPage: (
    args: TableRouteFetchPageArgs<TData>,
  ) => Promise<TResponse>;
  /**
   * When set, filterable string columns without a descriptor get a serializable `kind:
   * 'distinct'` filter-options descriptor baked in (ADR-009).
   */
  readonly filterOptions?: { readonly transport: FilterOptionsTransport };
  readonly includeFilters?: boolean;
  /**
   * Route-specific meta merged over the base (e.g. `crud`, `deleteActionPath`).
   * This is also where a request-shaping capability is declared, and omitting one leaves it
   * off (ADR-063).
   */
  readonly meta?: Partial<TableMetaState>;
  readonly persistenceKey: string;
  /**
   * Resolves what each of this route's columns may do in a grouped read, from the database
   * catalogue (ADR-058).
   * It is injected rather than called here because the answer is Node-only —
   * `@lcabrera/server`'s `getColumnGroupingCapabilities` reaches Postgres, and this package
   * is client-safe (ADR-038), so it may not import it.
   */
  readonly resolveGroupingCapabilities?: () => Promise<
    Readonly<Record<string, TableColumnGroupingCapability>>
  >;
  readonly schemaName?: string;
  readonly tableName: string;
  readonly title: TableMetaState['title'];
};

/**
 * `effectiveSorting` carries the primary-key tiebreaker for stable server pagination
 * (ADR-008); `filters` is sanitized against the route's columns.
 * `grouping` is the sanitized configuration — ordered keys plus the per-column aggregate
 * map — and it is **empty unless the route declared `isGroupingEnabled`**, so a route that
 * never opted in reads an empty one here however the URL is hand-edited, and forwarding it
 * unconditionally is safe.
 */
type TableRouteFetchPageArgs<TData extends Record<string, unknown>> = {
  readonly effectiveSorting: SortingState<TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly grouping: TableGroupingState;
  readonly request: Request;
  /**
   * Forward it to the grouped read — it is emitted as the direction of the `GROUPING()`
   * term, so a route that drops it silently ignores the setting rather than failing (#578).
   */
  readonly totalsPlacement: TableTotalsPlacement;
};

/**
 * It absorbs the boilerplate every table route repeated: read persisted state from URL +
 * cookies, sanitize sorting, append the primary-key tiebreaker, optionally bake distinct
 * filter descriptors onto the columns, and assemble the serializable `columnsState` /
 * `metaState`.
 * The returned loader returns `fetchPage`'s promise **unawaited**, preserving Suspense
 * streaming. Everything it returns is serializable — no functions cross the single-fetch
 * boundary (ADR-009).
 * It is `async` only because a grouping-enabled route has one plain value it must resolve
 * before the document can be painted: the catalogue's answer about what each column may do
 * (ADR-058). `fetchPage` is called **before** that await, so the data query and the
 * catalogue query overlap.
 */
export const createTableRouteLoader = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  appId,
  columns,
  defaultGrouping,
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
  // Read out of the route's own declaration for the same reason the two below
  // are re-asserted unconditionally: both are route facts a persisted cookie
  // must not be able to claim.
  const isUrlStateNested = meta?.isUrlStateNested === true;
  const groupDetailsPath = meta?.groupDetailsPath;

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
      totalsPlacement,
    } = readTableLoaderStateFromRequest<TData>({
      appId,
      columns,
      ...(defaultGrouping !== undefined && { defaultGrouping }),
      includeFilters,
      includeGrouping: capabilityMeta.isGroupingEnabled,
      isUrlStateNested,
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
      totalsPlacement,
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
        // The four grouping fields ride the same rule: each is
        // request-derived, so a conditional spread would let a stale cookie
        // entry stand in for one — and `groupingCapabilities` is the one that
        // decides which aggregates the menu offers, so a cookie able to seed it
        // would be a cookie able to widen what the client asks for.
        // Route-declared, and re-asserted here for the reason above:
        // `groupDetailsPath` becomes the `to` of a rendered link on every
        // complete group row, so a cookie able to seed it is a cookie able to
        // navigate a reader somewhere the route never named. Unconditional,
        // `undefined` included — a conditional spread is exactly what would let
        // the cookie's value stand when the route declares none.
        groupDetailsPath,
        groupingAggregates: grouping.aggregates,
        groupingCapabilities,
        groupingKeys: grouping.keys,
        groupingMode: grouping.mode,
        groupingPeriods: grouping.periods,
        groupingShares: grouping.shares,
        // Route-declared, so the client cannot claim it and cannot deny it: it
        // is what tells the clear path to record "off" in the URL, and a cookie
        // able to set it would make an ordinary table write an envelope no
        // loader here reads back differently.
        hasDefaultGrouping:
          defaultGrouping !== undefined && capabilityMeta.isGroupingEnabled,
        // Same rule: it decides which params this table's own state is written
        // under, so a cookie able to set it detaches a table's state from the
        // loader that reads it — the drawer updates and the rows do not.
        isUrlStateNested,
        totalsPlacement,
        ...capabilityMeta,
      },
    };
  };
};
