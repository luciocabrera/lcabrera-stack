import { useFetcher } from 'react-router';

import { TableActionsPopover } from '#ui/components/Table/TableActionsPopover';

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

  // A row with no resolvable id gets no CRUD menu rather than no application.
  // This runs during render, so the throwing form would take the whole grid to
  // an error boundary — which is exactly what a misclassified group row did
  // (ADR-062). Any custom actions still render: they act on the row, not on an
  // id.
  if (rowId === undefined) {
    return customActions;
  }

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
