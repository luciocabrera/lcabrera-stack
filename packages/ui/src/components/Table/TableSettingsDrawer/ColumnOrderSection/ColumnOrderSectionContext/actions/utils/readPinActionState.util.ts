import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumn,
  TableColumnsState,
} from '#ui/components/Table/Table.types';
import type { TableDrawerColumnsState } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.types';

type ReadPinActionStateArgs<TData extends Record<string, unknown>> = {
  readonly drawerState: TableDrawerColumnsState<TData> | undefined;
  readonly tableState: TableColumnsState<TData> | undefined;
};

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
