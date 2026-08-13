import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { NoDataDescriptive } from '#ui/components/Icons';
import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';
import { useElementSize, useResizeObserver } from '#ui/hooks';

import { styles } from './TableEmptyState.stylex';
import { TableEmptyStateAction } from './TableEmptyStateAction/TableEmptyStateAction.component';
import { TableEmptyStateMessage } from './TableEmptyStateMessage/TableEmptyStateMessage.component';

/**
 * Empty-state row rendered inside the table body when there are no rows and the
 * table is not loading. The content is pinned (`position: sticky`) and sized to
 * the scroll container's viewport minus the sticky header height, so it stays
 * centered in the visible body area — both axes — without introducing a
 * vertical scrollbar, even when the table body overflows horizontally.
 *
 * A thin shell over that arithmetic. *Why* the body is empty — nothing matched,
 * or the endpoint refused the query — decides both what it says and which
 * recovery it offers, and each delegate reads that for itself.
 */
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

  // Track the sticky header's border-box height (offsetHeight) so the empty
  // state can fill exactly the remaining visible body area.
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
          <div {...stylex.props(styles.content)}>
            <div {...stylex.props(styles.illustration)}>
              <NoDataDescriptive />
            </div>
            <TableEmptyStateMessage />
            <TableEmptyStateAction />
          </div>
        </div>
      </td>
    </tr>
  );
};
