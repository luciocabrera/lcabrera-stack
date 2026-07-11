import { Button } from '@repo/ui/components/Button';
import { NavLink } from '@repo/ui/components/NavLink';
import * as stylex from '@stylexjs/stylex';

import type { ToolbarItemProps } from './ToolbarItem.types';

import { styles } from '../Toolbar.stylex';
import { getCompactControlStyle } from '../utils/getCompactControlStyle.util';
import { getCompactItemStyle } from '../utils/getCompactItemStyle.util';

/**
 * Single toolbar entry: owns its compact style derivation and renders the
 * `<li>` wrapping either a `Button` (`type: 'button'`) or a `NavLink`
 * (`type: 'link'`), sharing the common control props across both branches.
 * Private delegate of `Toolbar` — not exported from the barrel.
 */
export const ToolbarItem = ({
  isCompact,
  item,
  orientation,
  size,
}: ToolbarItemProps) => {
  const resolvedSize = item.size ?? size;
  const sharedControlProps = {
    'aria-label': isCompact ? item.label : undefined,
    color: item.color,
    customStylex: isCompact ? getCompactControlStyle(resolvedSize) : undefined,
    icon: item.icon,
    isIconOnly: isCompact,
    orientation,
    size: resolvedSize,
    tooltipContent: isCompact ? item.label : undefined,
    tooltipPlacement: 'right' as const,
    width: 'full' as const,
  };

  return (
    <li
      {...stylex.props(
        styles.toolbarItem,
        orientation === 'horizontal' && styles.toolbarItemResponsive,
        isCompact && styles.toolbarItemCompact,
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
