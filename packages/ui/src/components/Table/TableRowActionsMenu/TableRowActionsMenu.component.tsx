import type { TableRowActionsMenuProps } from './TableRowActionsMenu.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import { useGetTableCrud } from '../contexts/TableConfig/meta/selectors';
import { resolveCrudRowId } from '../utils/resolveCrudRowId.util';
import { TableCrudRowActionsMenu } from './TableCrudRowActionsMenu.component';

export const TableRowActionsMenu = <TData extends Record<string, unknown>>({
  customActions,
  isLoadingState = false,
  row,
}: TableRowActionsMenuProps<TData>) => {
  const crud = useGetTableCrud();
  const columns = useGetColumns<TData>();

  if (!crud) {
    return customActions;
  }

  const rowId = resolveCrudRowId({ columns, row });

  if (rowId === undefined) {
    return customActions;
  }

  return (
    <TableCrudRowActionsMenu
      crud={crud}
      customActions={customActions}
      isLoadingState={isLoadingState}
      rowId={rowId}
    />
  );
};
