import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { NavLink } from '@/components/NavLink';

import type { ToolbarProps } from './Toolbar.types';

import { styles } from './Toolbar.stylex';

export const Toolbar = ({
  isCompact = false,
  items,
  orientation = 'vertical',
  size = 'md',
  ...props
}: ToolbarProps) => {
  return (
    <nav
      role='navigation'
      {...props}
      {...stylex.props(
        styles.toolbar,
        orientation === 'horizontal'
          ? styles.toolbarHorizontal
          : styles.toolbarVertical,
        isCompact && styles.toolbarCompact,
      )}
    >
      <ul
        {...stylex.props(
          styles.toolbar,
          orientation === 'horizontal'
            ? styles.toolbarHorizontal
            : styles.toolbarVertical,
          isCompact && styles.toolbarCompact,
        )}
      >
        {items.map((item) => {
          const itemKey = `toolbar-item-${item.label}`;

          return (
            <li
              key={itemKey}
              {...stylex.props(
                styles.toolbarItem,
                orientation === 'horizontal' && styles.toolbarItemResponsive,
                isCompact && styles.toolbarItemCompact,
              )}
            >
              {item.type === 'button' ? (
                <Button
                  aria-label={isCompact ? item.label : undefined}
                  color={item.color}
                  customStylex={isCompact ? styles.compactControl : undefined}
                  icon={item.icon}
                  isIconOnly={isCompact}
                  isDisabled={item.isDisabled}
                  onClick={item.onClick}
                  orientation={orientation}
                  size={item.size ?? size}
                  tooltipContent={isCompact ? item.label : undefined}
                  tooltipPlacement='right'
                  type={item.type}
                  width='full'
                >
                  {item.label}
                </Button>
              ) : (
                <NavLink
                  aria-label={isCompact ? item.label : undefined}
                  color={item.color}
                  customStylex={isCompact ? styles.compactControl : undefined}
                  end={item.end}
                  icon={item.icon}
                  isIconOnly={isCompact}
                  orientation={orientation}
                  size={item.size ?? size}
                  tooltipContent={isCompact ? item.label : undefined}
                  tooltipPlacement='right'
                  to={item.to}
                  width='full'
                >
                  {item.label}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
