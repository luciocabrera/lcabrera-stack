import type { ColumnFiltersState, SortingState } from '#ui/components/Table';
import type {
  TableColumnGroupingCapability,
  TableGroupingState,
  TableMetaState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

export type TableRouteFetchPageArgs<TData extends Record<string, unknown>> = {
  readonly effectiveSorting: SortingState<TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly grouping: TableGroupingState;
  readonly request: Request;
  readonly totalsPlacement: TableTotalsPlacement;
};

export type TableRouteLoaderSourceArgs<
  TData extends Record<string, unknown>,
  TResponse,
> =
  | (Omit<TableRouteSource<TData, TResponse>, 'capabilities' | 'pagePath'> & {
      readonly source?: never;
    })
  | {
      readonly fetchPage?: never;
      readonly resolveGroupingCapabilities?: never;
      readonly schemaName?: never;
      readonly source: TableRouteSource<TData, TResponse>;
      readonly tableName?: never;
    };

export type TableRouteSource<
  TData extends Record<string, unknown>,
  TResponse,
> = {
  /** Request-shaping capabilities the source serves; the route's `meta` overrides each one. */
  readonly capabilities?: Partial<
    Pick<
      TableMetaState,
      'isGroupingEnabled' | 'isKeysetEnabled' | 'isServerFilterEnabled'
    >
  >;
  readonly fetchPage: (
    args: TableRouteFetchPageArgs<TData>,
  ) => Promise<TResponse>;
  /** Endpoint the grid asks for every page after the first. */
  readonly pagePath?: string;
  readonly resolveGroupingCapabilities?: () => Promise<
    Readonly<Record<string, TableColumnGroupingCapability>>
  >;
  readonly schemaName?: string;
  readonly tableName: string;
};
