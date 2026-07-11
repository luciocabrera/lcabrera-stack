import * as stylex from '@stylexjs/stylex';

import type { ToolbarProps } from './Toolbar.types';

import { styles } from './Toolbar.stylex';
import { ToolbarItem } from './ToolbarItem/ToolbarItem.component';

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
        {items.map((item) => (
          <ToolbarItem
            isCompact={isCompact}
            item={item}
            key={`toolbar-item-${item.label}`}
            orientation={orientation}
            size={size}
          />
        ))}
      </ul>
    </nav>
  );
};
