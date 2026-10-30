import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import { TREND_SPARKLINE_DOT } from '#ui/components/TrendSparkline/TrendSparkline.constants';

import type { TrendSparklineDotProps } from './TrendSparklineDot.types';

import { styles } from './TrendSparklineDot.stylex';

export const TrendSparklineDot = ({
  cx,
  cy,
  label,
  to,
  tone,
  value,
}: TrendSparklineDotProps) => {
  const name = label ?? String(value);
  const circle = (
    <circle
      cx={cx}
      cy={cy}
      r={TREND_SPARKLINE_DOT.radius}
      {...stylex.props(styles.dot, styles.tone[tone])}
    >
      <title>{name}</title>
    </circle>
  );

  if (to === undefined) return circle;

  return (
    <Link aria-label={name} to={to} {...stylex.props(styles.link)}>
      {circle}
    </Link>
  );
};
