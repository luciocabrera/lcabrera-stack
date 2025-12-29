import * as stylex from '@stylexjs/stylex';
import { NavLink } from 'react-router';

import type { ToolbarLinkItemProps } from '../Toolbar.types';

import { rippleStyles, styles } from './ToolbarLinkItem.stylex';

export const ToolbarLinkItem = ({
  color = 'ghost',
  end,
  icon,
  label,
  size = 'md',
  to,
  ...props
}: ToolbarLinkItemProps) => {
  const sizeStyle =
    size === 'lg' ? styles.itemLg : size === 'sm' ? styles.itemSm : styles.itemMd;
  const colorStyle =
    color === 'primary'
      ? styles.itemPrimary
      : color === 'error'
        ? styles.itemError
        : color === 'secondary'
          ? styles.itemSecondary
          : color === 'success'
            ? styles.itemSuccess
            : color === 'warning'
              ? styles.itemWarning
              : color === 'outline'
                ? styles.itemOutline
                : styles.itemGhost;

  return (
    <NavLink
      className={({ isActive }) =>
        stylex.props(
          styles.item,
          rippleStyles.base,
          rippleStyles.variants[color],
          sizeStyle,
          colorStyle,
          isActive && styles.itemActive,
        ).className!
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
