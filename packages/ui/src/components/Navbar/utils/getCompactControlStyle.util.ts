import type { DesignSystemSize } from '#ui/types/design-system.types';

import { styles } from '../Navbar.stylex';

const COMPACT_CONTROL_STYLES = {
  embedded: styles.compactControlEmbedded,
  lg: styles.compactControlLg,
  md: styles.compactControlMd,
  mini: styles.compactControlMini,
  sm: styles.compactControlSm,
} as const;

export const getCompactControlStyle = (size: DesignSystemSize) =>
  COMPACT_CONTROL_STYLES[size];
