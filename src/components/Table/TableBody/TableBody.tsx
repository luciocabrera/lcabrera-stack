import * as stylex from '@stylexjs/stylex';

import type { TableBodyProps } from './TableBody.types';

import { TableRow } from '../TableRow/TableRow';
import { tableBodyStyles } from './TableBody.stylex';

const DEFAULT_ROW_HEIGHT = 48;

export function TableBody<Row>(props: TableBodyProps<Row>) {
  const {
    customStylex,
    emptyState,
    getRowKey,
    isStriped = false,
    renderRow,
    rowHeight = DEFAULT_ROW_HEIGHT,
    rows,
    ...rest
  } = props;

  if (!rows || rows.length === 0) {
    return (
      <tbody
        data-testid="table-body-empty"
        {...rest}
        {...stylex.props(tableBodyStyles.viewport, customStylex)}
      >
        <tr>
          <td colSpan={1000}>{emptyState}</td>
        </tr>
      </tbody>
    );
  }

  const safeRowHeight = Math.max(1, rowHeight);
  return (
    <tbody
      data-testid="table-body"
      {...rest}
      {...stylex.props(tableBodyStyles.viewport, customStylex)}
    >
      {rows.map((row, index) => {
        const key = getRowKey ? getRowKey(row, index) : index;
        const isRowStriped = isStriped && index % 2 === 1;
        return (
          <TableRow
            isStriped={isRowStriped}
            key={key}
            style={{ height: safeRowHeight, minHeight: safeRowHeight }}
          >
            {renderRow(row, index)}
          </TableRow>
        );
      })}
    </tbody>
  );
}
