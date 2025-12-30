import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { TableProps } from './Table.types';

import { styles } from './Table.stylex';
import { TableBase } from './TableBase';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';

export const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  overscan = 6,
  rowHeight = 32,
}: TableProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} {...stylex.props(styles.container)}>
      <TableBase density='compact' isBordered isStriped>
        <TableHeader columns={columns} />
        <TableBody
          columns={columns}
          data={data}
          overscan={overscan}
          rowHeight={rowHeight}
          tableContainerRef={containerRef}
        />
      </TableBase>
    </div>
  );
};
// #5a7cdd