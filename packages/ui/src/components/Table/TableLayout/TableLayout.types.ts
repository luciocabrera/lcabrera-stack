import type {
  TableColumnsState,
  TableMetaState,
  TableProps,
} from '@repo/ui/components/Table';

export type TableLayoutProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableProps<TData, TResponse>,
  'dataSelector' | 'dataTotalSelector' | 'onLoadMore'
> & {
  /** Loader-seeded initial columns state (required) */
  readonly columnsState: Omit<
    TableColumnsState<TData>,
    | 'columnGroups'
    | 'effectiveColumns'
    | 'normalizedColumns'
    | 'pinnedColumnOffsets'
    | 'staticKeys'
  >;
  /** Promise that resolves to the initial data (required) */
  readonly dataPromise: Promise<TResponse>;
  /** Function to extract data array from the promise response (required) */
  // dataSelector: (response: TResponse) => TData[];
  // dataTotalSelector?: (response: TResponse) => number;
  /** Loader-seeded initial meta state (required) */
  readonly metaState: Partial<TableMetaState>;
};
