import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import { LINE_CHART_TABLE_HEADINGS } from '#ui/components/LineChart/LineChart.constants';
import { getDataTableRows } from '#ui/components/LineChart/utils/getDataTableRows.util';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { LineChartDataTableProps } from './LineChartDataTable.types';

export const LineChartDataTable = ({
  formatters,
  series,
  title,
  xLabel = LINE_CHART_TABLE_HEADINGS.x,
  yLabel = LINE_CHART_TABLE_HEADINGS.y,
}: LineChartDataTableProps) => (
  <table {...stylex.props(accessibility.visuallyHidden)}>
    <caption>{title}</caption>
    <thead>
      <tr>
        <th scope='col'>{LINE_CHART_TABLE_HEADINGS.series}</th>
        <th scope='col'>{xLabel}</th>
        <th scope='col'>{yLabel}</th>
      </tr>
    </thead>
    <tbody>
      {getDataTableRows({ formatters, series }).map((row) => (
        <tr key={row.key}>
          <th scope='row'>{row.series}</th>
          <td>{row.x}</td>
          <td>
            {row.to === undefined ? row.y : <Link to={row.to}>{row.y}</Link>}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
