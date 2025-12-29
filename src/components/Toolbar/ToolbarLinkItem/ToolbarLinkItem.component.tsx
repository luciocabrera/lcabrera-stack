import * as stylex from '@stylexjs/stylex';
import { NavLink } from 'react-router';

import type { ToolbarLinkItemProps } from '../Toolbar.types';

import { styles } from './ToolbarLinkItem.stylex';

export const ToolbarLinkItem = ({
  end,
  icon,
  label,
  size = 'md',
  to,
  ...props
}: ToolbarLinkItemProps) => {
  const sizeStyle =
    size === 'lg' ? styles.itemLg : size === 'sm' ? styles.itemSm : styles.itemMd;

  return (
    <NavLink
      className={({ isActive }) =>
        stylex.props(styles.item, sizeStyle, isActive && styles.itemActive)
          .className!
      }
      end={end}
      to={to}
      {...props}
    >
      {icon && <span {...stylex.props(styles.itemIcon)}>{icon}</span>}
      <span {...stylex.props(styles.itemLabel)}>{label}</span>
    </NavLink>
  );
};
