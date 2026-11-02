import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import { lineChartStroke } from '#ui/components/LineChart/LineChart.stylex';

import type { LineChartDotProps } from './LineChartDot.types';

import { lineChartDotStyles } from './LineChartDot.stylex';

export const LineChartDot = ({ d, label, to, tone }: LineChartDotProps) => {
  const mark = (
    <path
      d={d}
      {...stylex.props(lineChartDotStyles.dot, lineChartStroke[tone])}
    >
      <title>{label}</title>
    </path>
  );

  if (to === undefined) return mark;

  return (
    <Link aria-label={label} to={to} {...stylex.props(lineChartDotStyles.link)}>
      {mark}
    </Link>
  );
};
