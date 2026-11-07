import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';
import { useElementSize, useResizeObserver } from '#ui/hooks';

import { styles } from './TableEmptyState.stylex';
import { TableEmptyStateBody } from './TableEmptyStateBody.component';

export const TableEmptyState = () => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();

  const containerRef = useTableContainerRef();
  const { height: containerHeight, width } = useElementSize({
    ref: containerRef,
  });

  const [headerHeight, setHeaderHeight] = useState(0);

  const colSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;
  const viewportHeight =
    containerHeight > 0 ? Math.max(0, containerHeight - headerHeight) : 0;

  useResizeObserver({
    getTarget: () => containerRef.current?.querySelector<HTMLElement>('thead'),
    onMeasure: (header) => {
      setHeaderHeight(header.offsetHeight);
    },
  });

  return (
    <tr {...stylex.props(styles.row)}>
      <td colSpan={colSpan} {...stylex.props(styles.cell)}>
        <div {...stylex.props(styles.viewport(viewportHeight, width))}>
          <TableEmptyStateBody />
        </div>
      </td>
    </tr>
  );
};
