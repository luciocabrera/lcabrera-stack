import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { VirtualizedTableProps } from './VirtualizedTable.types';

import { Table } from './Table';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';
import { styles } from './VirtualizedTable.stylex';

export const VirtualizedTable = <T extends Record<string, unknown>>({
  columns,
  data,
  height = 400,
  overscan = 6,
  rowHeight = 32,
}: VirtualizedTableProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      {...stylex.props(styles.container(height))}
    >
      <Table
        density='compact'
        isBordered
        isStriped
      >
        <TableHeader columns={columns} />
        <TableBody
          columns={columns}
          data={data}
          overscan={overscan}
          rowHeight={rowHeight}
          tableContainerRef={containerRef}
        />
      </Table>
    </div>
  );
};
