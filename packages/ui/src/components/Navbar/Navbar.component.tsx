import * as stylex from '@stylexjs/stylex';

import type { NavbarProps } from './Navbar.types';

import { styles } from './Navbar.stylex';
import { NavbarItem } from './NavbarItem';

export const Navbar = ({
  isCompact = false,
  items,
  orientation = 'vertical',
  size = 'md',
  ...props
}: NavbarProps) => {
  return (
    <nav
      {...props}
      {...stylex.props(
        styles.navbar,
        orientation === 'horizontal'
          ? styles.navbarHorizontal
          : styles.navbarVertical,
        isCompact && styles.navbarCompact,
      )}
    >
      <ul
        {...stylex.props(
          styles.navbar,
          orientation === 'horizontal'
            ? styles.navbarHorizontal
            : styles.navbarVertical,
          isCompact && styles.navbarCompact,
        )}
      >
        {items.map((item) => (
          <NavbarItem
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
