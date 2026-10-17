import * as stylex from '@stylexjs/stylex';

import type { FiguresTableProps } from './FiguresTable.types';

import { styles } from './FiguresTable.stylex';

export const FiguresTable = ({ caption, columns, rows }: FiguresTableProps) => (
  <div {...stylex.props(styles.scroller)}>
    <table {...stylex.props(styles.table)}>
      <caption {...stylex.props(styles.caption)}>{caption}</caption>
      <thead>
        <tr>
          {columns.map(({ isNumeric = false, key, label }) => (
            <th
              key={key}
              scope='col'
              {...stylex.props(
                styles.cell,
                styles.head,
                isNumeric && styles.numeric,
              )}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ cells, key: rowKey }) => (
          <tr key={rowKey}>
            {columns.map(({ isNumeric = false, key }) => (
              <td
                key={key}
                {...stylex.props(styles.cell, isNumeric && styles.numeric)}
              >
                {cells[key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
