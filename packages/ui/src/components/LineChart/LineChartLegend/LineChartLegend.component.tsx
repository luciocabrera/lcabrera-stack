import * as stylex from '@stylexjs/stylex';

import { lineChartSwatch } from '#ui/components/LineChart/LineChart.stylex';

import type { LineChartLegendProps } from './LineChartLegend.types';

import { lineChartLegendStyles } from './LineChartLegend.stylex';

export const LineChartLegend = ({ series }: LineChartLegendProps) => (
  <ul {...stylex.props(lineChartLegendStyles.list)}>
    {series.map(({ id, isDashed, label, tone }) => (
      <li key={id} {...stylex.props(lineChartLegendStyles.item)}>
        <span
          aria-hidden
          {...stylex.props(
            lineChartLegendStyles.swatch,
            lineChartSwatch[tone],
            isDashed && lineChartLegendStyles.dashed,
          )}
        />
        {label}
      </li>
    ))}
  </ul>
);
