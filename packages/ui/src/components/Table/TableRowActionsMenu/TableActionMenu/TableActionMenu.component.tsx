import { Button } from '@repo/ui/components/Button';
import { EraserIcon, EyeIcon, FileTextIcon } from '@repo/ui/components/Icons';
import { NavLink } from '@repo/ui/components/NavLink';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

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
      {crud.read && (
        <NavLink
          color='ghost'
          customStylex={tableActionsPopoverStyles.menuItem}
          icon={
            <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
              <EyeIcon size={16} />
            </span>
          }
          orientation='horizontal'
          size='mini'
          to={`view/${String(rowId)}`}
        >
          {`View ${resolvedTitleSingular}`}
        </NavLink>
      )}
      {crud.update && (
        <NavLink
          color='ghost'
          customStylex={tableActionsPopoverStyles.menuItem}
          icon={
            <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
              <FileTextIcon size={16} />
            </span>
          }
          orientation='horizontal'
          size='mini'
          to={`edit/${String(rowId)}`}
        >
          {`Edit ${resolvedTitleSingular}`}
        </NavLink>
      )}
      {crud.delete && (
        <Button
          color='ghost'
          customStylex={tableActionsPopoverStyles.menuItem}
          icon={
            <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
              <EraserIcon size={16} />
            </span>
          }
          onClick={onDelete}
          orientation='horizontal'
          size='mini'
        >
          {`Delete ${resolvedTitleSingular}`}
        </Button>
      )}
      {customActions && (
        <div {...stylex.props(styles.customActions)}>{customActions}</div>
      )}
    </div>
  );
};
