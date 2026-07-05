import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';
import { useRevalidator } from 'react-router';

import { Button } from '@repo/ui/components/Button';
import { NoDataDescriptive } from '@repo/ui/components/Icons';
import { useGetColumnGroups } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { useTableContainerRef } from '@repo/ui/components/Table/contexts/TableWrapper';
import { useElementSize } from '@repo/ui/hooks';

import type { TableEmptyStateProps } from './TableEmptyState.types';

import { styles } from './TableEmptyState.stylex';

const DEFAULT_MESSAGE =
  'No records match the current view. Try adjusting your filters or refreshing the table.';
const DEFAULT_TITLE = 'No data found';

/**
 * Empty-state row rendered inside the table body when there are no rows and the
 * table is not loading. The content is pinned (`position: sticky`) and sized to
 * the scroll container's viewport minus the sticky header height, so it stays
 * centered in the visible body area — both axes — without introducing a
 * vertical scrollbar, even when the table body overflows horizontally.
 */
export const TableEmptyState = ({
  message = DEFAULT_MESSAGE,
  title = DEFAULT_TITLE,
}: TableEmptyStateProps) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const containerRef = useTableContainerRef();
  const { height: containerHeight, width } = useElementSize({
    ref: containerRef,
  });
  const [headerHeight, setHeaderHeight] = useState(0);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const header = containerRef.current?.querySelector<HTMLElement>('thead');

    if (!header) return;

    const measure = () => {
      // eslint-disable-next-line react-x/set-state-in-effect -- Header height must be read from the DOM (offsetHeight); it cannot be derived during render
      setHeaderHeight(header.offsetHeight);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(header);

    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  const colSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;
  const viewportHeight =
    containerHeight > 0 ? Math.max(0, containerHeight - headerHeight) : 0;

  return (
    <tr {...stylex.props(styles.row)}>
      <td colSpan={colSpan} {...stylex.props(styles.cell)}>
        <div {...stylex.props(styles.viewport(viewportHeight, width))}>
          <div {...stylex.props(styles.content)}>
            <div {...stylex.props(styles.illustration)}>
              <NoDataDescriptive />
            </div>
            {title ? (
              <h3 {...stylex.props(styles.title)}>{title}</h3>
            ) : undefined}
            {message ? (
              <p {...stylex.props(styles.message)}>{message}</p>
            ) : undefined}
            <Button color='primary' onClick={revalidate}>
              Retry
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
};
