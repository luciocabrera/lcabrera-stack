import * as stylex from '@stylexjs/stylex';

import type { StatusBadgeProps } from './StatusBadge.types';

import { styles } from './StatusBadge.stylex';

export const StatusBadge = ({ label, tone }: StatusBadgeProps) => (
  <span {...stylex.props(styles.badge, styles.tone[tone])}>{label}</span>
);
