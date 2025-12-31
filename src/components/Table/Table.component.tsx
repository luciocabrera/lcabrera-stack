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
  density = 'compact',
  isBordered = false,
  isFlexWrapperEnabled = true,
  isLoading = false,
  isStriped = false,
  locale,
  overscan = 6,
  rowHeight = 32,
}: TableProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const tableContent = (
    <div ref={containerRef} {...stylex.props(styles.container)}>
      {/* <TableOverlay isVisible={isLoading && data.length > 0} /> */}
      <TableBase density={density} isBordered={isBordered} isStriped={isStriped}>
        <TableHeader columns={columns} isLoading={isLoading} />
        <TableBody
          columns={columns}
          data={data}
          isLoading={isLoading}
          locale={locale}
          overscan={overscan}
          rowHeight={rowHeight}
          tableContainerRef={containerRef}
        />
      </TableBase>
    </div>
  );

  if (isFlexWrapperEnabled)
    return <div {...stylex.props(styles.wrapper)}>{tableContent}</div>;

  return tableContent;
};
