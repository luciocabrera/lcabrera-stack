import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { TableProps } from './Table.types';

import { useSkeletonRowCount } from './hooks';
import { styles } from './Table.stylex';
import { TableBase } from './TableBase';
import { TableBody } from './TableBody';
import { TableBodySkeleton } from './TableBodySkeleton';
import { TableHeader } from './TableHeader';
import { TableOverlay } from './TableOverlay';

export const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  isFlexWrapperEnabled = true,
  isLoading = false,
  locale,
  overscan = 6,
  rowHeight = 32,
  skeletonRowCount: fallbackRowCount = 10,
}: TableProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const skeletonRowCount = useSkeletonRowCount({
    containerRef,
    fallbackRowCount,
    rowHeight,
  });

  const tableContent = (
    <div ref={containerRef} {...stylex.props(styles.container)}>
      <TableOverlay isVisible={isLoading} />
      <TableBase density='compact' isBordered isStriped>
        <TableHeader columns={columns} />
        {isLoading ? (
          <TableBodySkeleton
            columns={columns}
            rowCount={skeletonRowCount}
            rowHeight={rowHeight}
          />
        ) : (
          <TableBody
            columns={columns}
            data={data}
            locale={locale}
            overscan={overscan}
            rowHeight={rowHeight}
            tableContainerRef={containerRef}
          />
        )}
      </TableBase>
    </div>
  );

  if (isFlexWrapperEnabled)
    return <div {...stylex.props(styles.wrapper)}>{tableContent}</div>;

  return tableContent;
};
