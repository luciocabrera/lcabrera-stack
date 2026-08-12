import type { LoaderFunctionArgs } from 'react-router';

import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';
import type {
  FilterOptionsTransport,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { appendPrimaryKeySorting } from '../shared/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '../shared/sanitizeSorting.util';
import { appendDistinctFilterDescriptors } from './appendDistinctFilterDescriptors.util';
import { readTableLoaderStateFromRequest } from './readTableLoaderStateFromRequest.util';

/**
 * What a `createTableRouteLoader` loader hands the route component. Derived
 * from the factory rather than restated, so the view side cannot drift from
 * what the loader actually returns — `useTableRoutePage` reads exactly this.
 */
export type TableRouteLoaderData<
  TData extends Record<string, unknown>,
  TResponse,
> = ReturnType<ReturnType<typeof createTableRouteLoader<TData, TResponse>>>;

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
   * This is also where a request-shaping capability is declared — omitting one
   * leaves it off (ADR-063), so the loader and the view's load-more read the
   * same single declaration of what the endpoint understands.
   */
  readonly meta?: Partial<TableMetaState>;
  readonly persistenceKey: string;
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
 */
type TableRouteFetchPageArgs<TData extends Record<string, unknown>> = {
  readonly effectiveSorting: SortingState<TData>;
  readonly filters: ColumnFiltersState<TData>;
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
 * The returned loader is synchronous and returns `fetchPage`'s promise
 * unawaited, preserving Suspense streaming. Everything it returns is
 * serializable — no functions cross the single-fetch boundary (ADR-009).
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

  return ({ request }: LoaderFunctionArgs) => {
    const {
      columnOrder,
      columnPinning,
      columnSizing,
      columnVisibility,
      filters,
      metaUiFlags,
      sorting,
    } = readTableLoaderStateFromRequest<TData>({
      appId,
      columns,
      includeFilters,
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
      // Return the promise unawaited for Suspense streaming. A navigation
      // re-runs the loader, so `TableDataResolver`'s `use()` receives a new
      // promise and re-suspends — nothing has to key the boundary by hand.
      dataPromise: fetchPage({ effectiveSorting, filters, request }),
      metaState: {
        ...metaUiFlags,
        appId,
        persistenceKey,
        tableName,
        title,
        ...(schemaName !== undefined && { schemaName }),
        ...meta,
      },
    };
  };
};
