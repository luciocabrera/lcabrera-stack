import * as stylex from '@stylexjs/stylex';

import { chartDataTableStyles } from '#ui/components/ChartSettings/chartDataTable.stylex';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { HeatmapDataTableProps } from './HeatmapDataTable.types';

export const HeatmapDataTable = ({
  columns,
  isVisible,
  rows,
  title,
}: HeatmapDataTableProps) => {
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
          <td {...cell} />
          {columns.map(({ key, label }) => (
            <th key={key} scope='col' {...cell}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ cells, key, label }) => (
          <tr key={key}>
            <th scope='row' {...cell}>
              {label}
            </th>
            {cells.map((dataCell) => (
              <td key={dataCell.key} {...cell}>
                {dataCell.label}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
