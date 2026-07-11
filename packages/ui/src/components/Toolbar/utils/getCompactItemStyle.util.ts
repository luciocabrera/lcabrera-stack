import type { DesignSystemSize } from '@repo/ui/types/design-system.types';

import { styles } from '../Toolbar.stylex';

const COMPACT_ITEM_STYLES = {
  embedded: styles.toolbarItemCompactEmbedded,
  lg: styles.toolbarItemCompactLg,
  md: styles.toolbarItemCompactMd,
  mini: styles.toolbarItemCompactMini,
  sm: styles.toolbarItemCompactSm,
} as const;

/**
 * Resolve the compact `<li>` sizing style for a toolbar entry's design-system
 * size.
 */
export const getCompactItemStyle = (size: DesignSystemSize) =>
  COMPACT_ITEM_STYLES[size];
