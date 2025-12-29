import * as stylex from '@stylexjs/stylex';

import type { ToolbarProps } from './Toolbar.types';

import { styles } from './Toolbar.stylex';
import { ToolbarButtonItem } from './ToolbarButtonItem';
import { ToolbarLinkItem } from './ToolbarLinkItem';

export const Toolbar = ({
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
      )}
    >
      <ul
        {...stylex.props(
          styles.toolbar,
          orientation === 'horizontal'
            ? styles.toolbarHorizontal
            : styles.toolbarVertical,
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
              )}
            >
              {item.type === 'button' ? (
                <ToolbarButtonItem
                  color={item.color}
                  icon={item.icon}
                  isDisabled={item.isDisabled}
                  label={item.label}
                  onClick={item.onClick}
                  size={item.size ?? size}
                  type={item.type}
                />
              ) : (
                <ToolbarLinkItem
                  end={item.end}
                  icon={item.icon}
                  label={item.label}
                  size={size}
                  to={item.to}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
