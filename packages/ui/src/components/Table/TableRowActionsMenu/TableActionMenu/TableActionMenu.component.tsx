import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { EraserIcon, EyeIcon, FileTextIcon } from '#ui/components/Icons';
import { NavLink } from '#ui/components/NavLink';
import {
  TableActionsPopoverSeparator,
  tableActionsPopoverStyles,
} from '#ui/components/Table/TableActionsPopover';

import type { TableActionMenuProps } from './TableActionMenu.types';

import { styles } from '../TableRowActionsMenu.stylex';

export const TableActionMenu = ({
  crud,
  customActions,
  onDelete,
  resolvedTitleSingular,
  rowId,
}: TableActionMenuProps) => {
  return (
    <div {...stylex.props(tableActionsPopoverStyles.menuActions)}>
      {Boolean(crud.read) && (
        <NavLink
          customStylex={tableActionsPopoverStyles.menuItem}
          icon={
            <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
              <EyeIcon size={16} />
            </span>
          }
          orientation='horizontal'
          size='mini'
          to={`view/${String(rowId)}`}
          variant='ghost'
        >
          {`View ${resolvedTitleSingular}`}
        </NavLink>
      )}
      {Boolean(crud.update) && (
        <NavLink
          customStylex={tableActionsPopoverStyles.menuItem}
          icon={
            <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
              <FileTextIcon size={16} />
            </span>
          }
          orientation='horizontal'
          size='mini'
          to={`edit/${String(rowId)}`}
          variant='ghost'
        >
          {`Edit ${resolvedTitleSingular}`}
        </NavLink>
      )}
      {Boolean(crud.delete) && (
        <Button
          customStylex={tableActionsPopoverStyles.menuItem}
          icon={
            <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
              <EraserIcon size={16} />
            </span>
          }
          onClick={onDelete}
          orientation='horizontal'
          size='mini'
          variant='ghost'
        >
          {`Delete ${resolvedTitleSingular}`}
        </Button>
      )}
      {Boolean(customActions) && (
        <>
          <TableActionsPopoverSeparator />
          <div {...stylex.props(styles.customActions)}>{customActions}</div>
        </>
      )}
    </div>
  );
};
