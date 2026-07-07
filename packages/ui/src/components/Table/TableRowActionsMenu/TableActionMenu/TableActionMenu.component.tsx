import { Button } from '@repo/ui/components/Button';
import { EraserIcon, EyeIcon, FileTextIcon } from '@repo/ui/components/Icons';
import { NavLink } from '@repo/ui/components/NavLink';
import * as stylex from '@stylexjs/stylex';

import type { TableActionMenuProps } from './TableActionMenu.types';

import { styles } from '../TableRowActionsMenu.stylex';

export const TableActionMenu = <TData extends Record<string, unknown>>({
  crud,
  customActions,
  onDelete,
  resolvedTitleSingular,
  rowId,
}: TableActionMenuProps<TData>) => {
  return (
    <div {...stylex.props(styles.menuActions)}>
      {crud.read && (
        <NavLink
          color='ghost'
          customStylex={styles.menuItem}
          icon={
            <span {...stylex.props(styles.menuIcon)}>
              <EyeIcon size={16} />
            </span>
          }
          orientation='horizontal'
          size='mini'
          to={`view/${String(rowId)}`}
          width='full'
        >
          {`View ${resolvedTitleSingular}`}
        </NavLink>
      )}
      {crud.update && (
        <NavLink
          color='ghost'
          customStylex={styles.menuItem}
          icon={
            <span {...stylex.props(styles.menuIcon)}>
              <FileTextIcon size={16} />
            </span>
          }
          orientation='horizontal'
          size='mini'
          to={`edit/${String(rowId)}`}
          width='full'
        >
          {`Edit ${resolvedTitleSingular}`}
        </NavLink>
      )}
      {crud.delete && (
        <Button
          color='ghost'
          customStylex={styles.menuItem}
          icon={
            <span {...stylex.props(styles.menuIcon)}>
              <EraserIcon size={16} />
            </span>
          }
          onClick={onDelete}
          orientation='horizontal'
          size='mini'
          width='full'
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
