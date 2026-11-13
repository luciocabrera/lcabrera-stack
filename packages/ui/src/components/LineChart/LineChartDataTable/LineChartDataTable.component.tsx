import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import { chartDataTableStyles } from '#ui/components/ChartSettings/chartDataTable.stylex';
import { LINE_CHART_TABLE_HEADINGS } from '#ui/components/LineChart/LineChart.constants';
import { getDataTableRows } from '#ui/components/LineChart/utils/getDataTableRows.util';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { LineChartDataTableProps } from './LineChartDataTable.types';

export const LineChartDataTable = ({
  formatters,
  isVisible,
  series,
  title,
  xLabel = LINE_CHART_TABLE_HEADINGS.x,
  yLabel = LINE_CHART_TABLE_HEADINGS.y,
}: LineChartDataTableProps) => {
  const cell = stylex.props(isVisible && chartDataTableStyles.cell);

  return (
    <table
      {...stylex.props(
        isVisible ? chartDataTableStyles.table : accessibility.visuallyHidden,
      )}
    >
      <caption>{title}</caption>
      <thead>
        <tr>
          <th scope='col' {...cell}>
            {LINE_CHART_TABLE_HEADINGS.series}
          </th>
          <th scope='col' {...cell}>
            {xLabel}
          </th>
          <th scope='col' {...cell}>
            {yLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {getDataTableRows({ formatters, series }).map((row) => (
          <tr key={row.key}>
            <th scope='row' {...cell}>
              {row.series}
            </th>
            <td {...cell}>{row.x}</td>
            <td {...cell}>
              {row.to === undefined ? row.y : <Link to={row.to}>{row.y}</Link>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
