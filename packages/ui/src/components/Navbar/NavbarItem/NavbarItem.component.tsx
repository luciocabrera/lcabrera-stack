import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { NavLink } from '#ui/components/NavLink';

import type { NavbarItemProps } from './NavbarItem.types';

import { getCompactControlStyle } from '../utils/getCompactControlStyle.util';
import { styles } from './NavbarItem.stylex';
import { getCompactItemStyle } from './utils/getCompactItemStyle.util';

/**
 * Single navbar entry: owns its compact style derivation and renders the
 * `<li>` wrapping either a `Button` (`type: 'button'`) or a `NavLink`
 * (`type: 'link'`), sharing the common control props across both branches.
 * Private delegate of `navbar` — not exported from the barrel.
 */
export const NavbarItem = ({
  isCompact,
  item,
  orientation,
  size,
}: NavbarItemProps) => {
  const resolvedSize = item.size ?? size;
  const sharedControlProps = {
    'aria-label': isCompact ? item.label : undefined,
    customStylex: isCompact ? getCompactControlStyle(resolvedSize) : undefined,
    icon: item.icon,
    isIconOnly: isCompact,
    orientation,
    size: resolvedSize,
    tooltipContent: isCompact ? item.label : undefined,
    tooltipPlacement: 'right' as const,
    variant: item.variant,
  };

  return (
    <li
      {...stylex.props(
        styles.navbarItem,
        orientation === 'horizontal' && styles.navbarItemResponsive,
        isCompact && styles.navbarItemCompact,
        isCompact && getCompactItemStyle(resolvedSize),
      )}
    >
      {item.type === 'button' ? (
        <Button
          {...sharedControlProps}
          isDisabled={item.isDisabled}
          onClick={item.onClick}
          type={item.type}
        >
          {item.label}
        </Button>
      ) : (
        <NavLink {...sharedControlProps} end={item.end} to={item.to}>
          {item.label}
        </NavLink>
      )}
    </li>
  );
};
