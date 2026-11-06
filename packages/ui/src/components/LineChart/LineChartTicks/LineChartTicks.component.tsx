import * as stylex from '@stylexjs/stylex';

import type { LineChartTicksProps } from './LineChartTicks.types';

import { lineChartTicksStyles } from './LineChartTicks.stylex';

export const LineChartTicks = ({ axis, ticks }: LineChartTicksProps) => {
  const place =
    axis === 'x' ? lineChartTicksStyles.xAt : lineChartTicksStyles.yAt;

  return (
    <div aria-hidden {...stylex.props(lineChartTicksStyles[axis])}>
      {ticks.map(({ at, key, text }) => (
        <span
          key={key}
          {...stylex.props(lineChartTicksStyles.label, place(`${String(at)}%`))}
        >
          {text}
        </span>
      ))}
    </div>
  );
};
