import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumn,
  TableColumnsState,
} from '@repo/ui/components/Table/Table.types';
import type { TableDrawerColumnsState } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.types';

type ReadPinActionStateArgs<TData extends Record<string, unknown>> = {
  readonly drawerState: TableDrawerColumnsState<TData> | undefined;
  readonly tableState: TableColumnsState<TData> | undefined;
};

/** Reads the shared column-order and pinning state needed by pin action hooks. */
export const readPinActionState = <TData extends Record<string, unknown>>({
  drawerState,
  tableState,
}: ReadPinActionStateArgs<TData>) => {
  return {
    columnPinning:
      drawerState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>),
    columns: (tableState?.columns ?? []) as readonly TableColumn<TData>[],
    columnsOrder: drawerState?.columnOrder ?? ([] as ColumnOrderState<TData>),
    staticKeys: tableState?.staticKeys,
  };
};
