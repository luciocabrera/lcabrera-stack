import type { TableColumnsState } from '@repo/ui/components/Table/Table.types';
import type { TableDrawerColumnsState } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.types';

type ReadPinActionStateArgs = {
  readonly drawerState:
    | TableDrawerColumnsState<Record<string, unknown>>
    | undefined;
  readonly tableState: TableColumnsState | undefined;
};

/** Reads the shared column-order and pinning state needed by pin action hooks. */
export const readPinActionState = ({
  drawerState,
  tableState,
}: ReadPinActionStateArgs) => ({
  columnPinning: drawerState?.columnPinning ?? { left: [], right: [] },
  columns: tableState?.columns ?? [],
  columnsOrder: drawerState?.columnOrder ?? [],
  staticKeys: tableState?.staticKeys,
});
