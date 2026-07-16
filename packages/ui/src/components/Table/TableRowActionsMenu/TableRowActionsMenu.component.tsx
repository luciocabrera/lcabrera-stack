import { TableActionsPopover } from '@repo/ui/components/Table/TableActionsPopover';
import { useFetcher } from 'react-router';

import type { TableRowActionsMenuProps } from './TableRowActionsMenu.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import {
  useGetTableCrud,
  useGetTableDeleteActionPath,
  useGetTableTitleSingular,
} from '../contexts/TableConfig/meta/selectors';
import { resolveCrudRowId } from '../utils/resolveCrudRowId.util';
import { TableActionMenu } from './TableActionMenu';

const DEFAULT_TITLE_SINGULAR = 'Record';

export const TableRowActionsMenu = <TData extends Record<string, unknown>>({
  customActions,
  isLoadingState = false,
  row,
}: TableRowActionsMenuProps<TData>) => {
  const crud = useGetTableCrud();
  const columns = useGetColumns<TData>();
  const deleteActionPath = useGetTableDeleteActionPath();
  const fetcher = useFetcher();
  const titleSingular = useGetTableTitleSingular();

  if (!crud) {
    return customActions;
  }

  const resolvedTitleSingular = titleSingular ?? DEFAULT_TITLE_SINGULAR;
  const rowId = resolveCrudRowId({ columns, row });

  return (
    <TableActionsPopover
      ariaLabel='Row actions'
      isDisabled={isLoadingState}
      label='Row actions'
    >
      {({ closeMenu }) => {
        const handleDelete = () => {
          if (!deleteActionPath) return;

          const shouldDelete = globalThis.confirm(
            `Are you sure you want to delete this ${resolvedTitleSingular.toLowerCase()}?`,
          );

          if (!shouldDelete) return;

          void fetcher.submit(
            {
              id: String(rowId),
              intent: 'delete',
            },
            {
              action: deleteActionPath,
              method: 'post',
            },
          );

          closeMenu();
        };

        return (
          <TableActionMenu
            crud={crud}
            customActions={customActions}
            onDelete={handleDelete}
            resolvedTitleSingular={resolvedTitleSingular}
            rowId={rowId}
          />
        );
      }}
    </TableActionsPopover>
  );
};
