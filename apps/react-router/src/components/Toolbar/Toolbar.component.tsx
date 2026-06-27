import * as stylex from '@stylexjs/stylex';

import type { DesignSystemSize } from '@/types/design-system.types';

import { Button } from '@/components/Button';
import { NavLink } from '@/components/NavLink';

import type { ToolbarProps } from './Toolbar.types';

import { styles } from './Toolbar.stylex';

const getCompactControlStyle = (size: DesignSystemSize) => {
  switch (size) {
    case 'embedded': {
      return styles.compactControlEmbedded;
    }
    case 'lg': {
      return styles.compactControlLg;
    }
    case 'mini': {
      return styles.compactControlMini;
    }
    case 'sm': {
      return styles.compactControlSm;
    }
    default: {
      return styles.compactControlMd;
    }
  }
};

const getCompactItemStyle = (size: DesignSystemSize) => {
  switch (size) {
    case 'embedded': {
      return styles.toolbarItemCompactEmbedded;
    }
    case 'lg': {
      return styles.toolbarItemCompactLg;
    }
    case 'mini': {
      return styles.toolbarItemCompactMini;
    }
    case 'sm': {
      return styles.toolbarItemCompactSm;
    }
    default: {
      return styles.toolbarItemCompactMd;
    }
  }
};

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
          const resolvedSize = item.size ?? size;
          const compactControlStyle = isCompact
            ? getCompactControlStyle(resolvedSize)
            : undefined;
          const compactItemStyle = isCompact
            ? getCompactItemStyle(resolvedSize)
            : undefined;

          return (
            <li
              key={itemKey}
              {...stylex.props(
                styles.toolbarItem,
                orientation === 'horizontal' && styles.toolbarItemResponsive,
                isCompact && styles.toolbarItemCompact,
                compactItemStyle,
              )}
            >
              {item.type === 'button' ? (
                <Button
                  aria-label={isCompact ? item.label : undefined}
                  color={item.color}
                  customStylex={compactControlStyle}
                  icon={item.icon}
                  isDisabled={item.isDisabled}
                  isIconOnly={isCompact}
                  onClick={item.onClick}
                  orientation={orientation}
                  size={resolvedSize}
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
                  customStylex={compactControlStyle}
                  end={item.end}
                  icon={item.icon}
                  isIconOnly={isCompact}
                  orientation={orientation}
                  size={resolvedSize}
                  to={item.to}
                  tooltipContent={isCompact ? item.label : undefined}
                  tooltipPlacement='right'
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
