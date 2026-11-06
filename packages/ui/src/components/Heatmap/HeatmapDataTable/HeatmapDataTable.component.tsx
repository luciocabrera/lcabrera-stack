import * as stylex from '@stylexjs/stylex';

import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { HeatmapDataTableProps } from './HeatmapDataTable.types';

export const HeatmapDataTable = ({
  columns,
  rows,
  title,
}: HeatmapDataTableProps) => (
  <table {...stylex.props(accessibility.visuallyHidden)}>
    <caption>{title}</caption>
    <thead>
      <tr>
        <td />
        {columns.map(({ key, label }) => (
          <th key={key} scope='col'>
            {label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(({ cells, key, label }) => (
        <tr key={key}>
          <th scope='row'>{label}</th>
          {cells.map((cell) => (
            <td key={cell.key}>{cell.label}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
