import { Button } from '@repo/ui/components/Button';
import { NoDataDescriptive } from '@repo/ui/components/Icons';
import { useGetPinnedColumnPartition } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { useTableContainerRef } from '@repo/ui/components/Table/contexts/TableWrapper';
import { useElementSize, useResizeObserver } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { useRevalidator } from 'react-router';

import { useGetTableTitleSingular } from '../contexts/TableConfig/meta/selectors';
import { styles } from './TableEmptyState.stylex';

const DEFAULT_MESSAGE =
  'No records match the current view. Try adjusting your filters or refreshing the table.';

/**
 * Empty-state row rendered inside the table body when there are no rows and the
 * table is not loading. The content is pinned (`position: sticky`) and sized to
 * the scroll container's viewport minus the sticky header height, so it stays
 * centered in the visible body area — both axes — without introducing a
 * vertical scrollbar, even when the table body overflows horizontally.
 */
export const TableEmptyState = () => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const titleSingular = useGetTableTitleSingular();

  const containerRef = useTableContainerRef();
  const { height: containerHeight, width } = useElementSize({
    ref: containerRef,
  });
  const { revalidate } = useRevalidator();

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
            <h3 {...stylex.props(styles.title)}>{titleSingular}</h3>
            <p {...stylex.props(styles.message)}>{DEFAULT_MESSAGE}</p>
            <Button onClick={revalidate} variant='primary'>
              Retry
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
};
