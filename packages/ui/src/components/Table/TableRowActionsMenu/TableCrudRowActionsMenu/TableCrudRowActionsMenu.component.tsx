import { useFetcher } from 'react-router';

import { TableActionsPopover } from '#ui/components/Table/TableActionsPopover';

import type { TableCrudRowActionsMenuProps } from './TableCrudRowActionsMenu.types';

import {
  useGetTableDeleteActionPath,
  useGetTableTitleSingular,
} from '../../contexts/TableConfig/meta/selectors';
import { TableActionMenu } from '../TableActionMenu';

const DEFAULT_TITLE_SINGULAR = 'Record';

export const TableCrudRowActionsMenu = ({
  crud,
  customActions,
  isLoadingState,
  rowId,
}: TableCrudRowActionsMenuProps) => {
  const deleteActionPath = useGetTableDeleteActionPath();
  const fetcher = useFetcher();
  const resolvedTitleSingular =
    useGetTableTitleSingular() ?? DEFAULT_TITLE_SINGULAR;

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
