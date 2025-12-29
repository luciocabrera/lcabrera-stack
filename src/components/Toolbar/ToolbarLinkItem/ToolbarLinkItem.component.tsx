import * as stylex from '@stylexjs/stylex';
import { NavLink } from 'react-router';

import type { ToolbarLinkItemProps } from '../Toolbar.types';

import { styles } from '../Toolbar.stylex';

export const ToolbarLinkItem = ({
  end,
  icon,
  label,
  to,
  ...props
}: ToolbarLinkItemProps) => {
  return (
    <NavLink
      className={({ isActive }) =>
        stylex.props(styles.item, isActive && styles.itemActive).className!
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
