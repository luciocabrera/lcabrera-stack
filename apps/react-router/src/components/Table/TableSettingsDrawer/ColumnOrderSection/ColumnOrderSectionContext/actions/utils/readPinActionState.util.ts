import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumn,
  TableColumnsState,
} from '@/components/Table/Table.types';
import type { TableDrawerColumnsState } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.types';

type ReadPinActionStateArgs = {
  readonly drawerState:
    | TableDrawerColumnsState<Record<string, unknown>>
    | undefined;
  readonly tableState: TableColumnsState | undefined;
};

type ReadPinActionStateResult = {
  readonly columnPinning: ColumnPinningState;
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
  readonly columnsOrder: ColumnOrderState;
  readonly staticKeys: Set<string> | undefined;
};

/** Reads the shared column-order and pinning state needed by pin action hooks. */
export const readPinActionState = ({
  drawerState,
  tableState,
}: ReadPinActionStateArgs): ReadPinActionStateResult => ({
  columnPinning: drawerState?.columnPinning ?? { left: [], right: [] },
  columns: tableState?.columns ?? [],
  columnsOrder: drawerState?.columnOrder ?? [],
  staticKeys: tableState?.staticKeys,
});
