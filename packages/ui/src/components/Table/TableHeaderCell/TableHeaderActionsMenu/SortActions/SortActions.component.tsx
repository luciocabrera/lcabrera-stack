import { Button } from '@repo/ui/components/Button';
import {
  EraserIcon,
  SortAscIcon,
  SortDescIcon,
} from '@repo/ui/components/Icons';
import { useSetColumnSorting } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { SortActionsProps } from './SortActions.types';

/**
 * Sorting section of the column header actions menu: "Ascending" and
 * "Descending" toggle their direction on/off, and "Clear Sorting" (shown only
 * while a direction is applied) removes the sort. Every action closes the
 * menu via `onClose`.
 */
export const SortActions = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: SortActionsProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();

  const handleAscending = () => {
    setSorting({
      columnKey,
      direction: sortDirection === 'asc' ? undefined : 'asc',
    });
    onClose();
  };

  const handleDescending = () => {
    setSorting({
      columnKey,
      direction: sortDirection === 'desc' ? undefined : 'desc',
    });
    onClose();
  };

  const handleClearSorting = () => {
    setSorting({ columnKey, direction: undefined });
    onClose();
  };

  return (
    <>
      <Button
        color='ghost'
        customStylex={tableActionsPopoverStyles.menuItem}
        icon={
          <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
            <SortAscIcon size={16} />
          </span>
        }
        onClick={handleAscending}
        orientation='horizontal'
        size='mini'
        width='full'
      >
        Ascending
      </Button>
      <Button
        color='ghost'
        customStylex={tableActionsPopoverStyles.menuItem}
        icon={
          <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
            <SortDescIcon size={16} />
          </span>
        }
        onClick={handleDescending}
        orientation='horizontal'
        size='mini'
        width='full'
      >
        Descending
      </Button>
      {sortDirection !== undefined && (
        <Button
          color='ghost'
          customStylex={tableActionsPopoverStyles.menuItem}
          icon={
            <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
              <EraserIcon size={16} />
            </span>
          }
          onClick={handleClearSorting}
          orientation='horizontal'
          size='mini'
          width='full'
        >
          Clear Sorting
        </Button>
      )}
    </>
  );
};
