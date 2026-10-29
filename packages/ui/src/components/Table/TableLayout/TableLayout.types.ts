import type {
  TableColumnsStateInput,
  TableGroupingState,
  TableMetaState,
  TableProps,
} from '#ui/components/Table';
import type {
  TableRowsSource,
  TableSelectedSource,
} from '#ui/components/Table/Table.types';

export type TableLayoutProps<
  TData extends Record<string, unknown>,
  TResponse,
> = (
  | (Omit<TableRowsSource<TData>, 'response'> & {
      readonly dataPromise: Promise<readonly TData[]>;
    })
  | (Omit<TableSelectedSource<TData, TResponse, TResponse>, 'response'> & {
      readonly dataPromise: Promise<TResponse>;
    })
) &
  Pick<
    TableProps<TData, TResponse>,
    'actions' | 'cellPalette' | 'cellRenderers'
  > & {
    readonly columnsState: TableColumnsStateInput<TData>;
    readonly groupingState?: Partial<TableGroupingState>;
    readonly metaState: Partial<TableMetaState>;
  };
