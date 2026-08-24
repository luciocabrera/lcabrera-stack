import type { DesignSystemSize } from '#ui/types/design-system.types';

import { styles } from '../NavbarItem.stylex';

const COMPACT_ITEM_STYLES = {
  embedded: styles.navbarItemCompactEmbedded,
  lg: styles.navbarItemCompactLg,
  md: styles.navbarItemCompactMd,
  mini: styles.navbarItemCompactMini,
  sm: styles.navbarItemCompactSm,
} as const;

export const getCompactItemStyle = (size: DesignSystemSize) =>
  COMPACT_ITEM_STYLES[size];
