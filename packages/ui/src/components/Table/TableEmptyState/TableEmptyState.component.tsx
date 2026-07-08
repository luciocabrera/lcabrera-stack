import { Button } from '@repo/ui/components/Button';
import { NoDataDescriptive } from '@repo/ui/components/Icons';
import { useGetColumnGroups } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { useTableContainerRef } from '@repo/ui/components/Table/contexts/TableWrapper';
import { useElementSize } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';
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
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
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

  // TODO: Check other resize observers maybe we can have an unihe sharable hook for this
  useEffect(() => {
    const header = containerRef.current?.querySelector<HTMLElement>('thead');

    if (!header) return;

    const measure = () => {
      setHeaderHeight(header.offsetHeight);
    };

    // The initial measurement is deferred to a microtask so the effect body
    // never sets state synchronously (react-x/set-state-in-effect); with a
    // real ResizeObserver, `observe()` also delivers an initial callback.
    let isMeasureCancelled = false;
    queueMicrotask(() => {
      if (!isMeasureCancelled) measure();
    });

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        isMeasureCancelled = true;
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(header);

    return () => {
      isMeasureCancelled = true;
      observer.disconnect();
    };
  }, [containerRef]);

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
            <Button color='primary' onClick={revalidate}>
              Retry
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
};
