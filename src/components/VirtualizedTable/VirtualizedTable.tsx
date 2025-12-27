import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { VirtualizedTableProps } from './VirtualizedTable.types';

import { Table } from '../Table';
import { VirtualizedTableBody } from './components/VirtualizedTableBody';
import { VirtualizedTableHeader } from './components/VirtualizedTableHeader';
import { styles } from './VirtualizedTable.stylex';

export function VirtualizedTable<T extends Record<string, unknown>>({
  columns,
  data,
  height = 400,
  overscan = 6,
  rowHeight = 32,
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} {...stylex.props(styles.container(height))}>
      <Table density="compact" isBordered isStriped>
        <VirtualizedTableHeader columns={columns} />
        <VirtualizedTableBody
          columns={columns}
          data={data}
          overscan={overscan}
          rowHeight={rowHeight}
          tableContainerRef={containerRef}
        />
      </Table>
    </div>
  );
}
