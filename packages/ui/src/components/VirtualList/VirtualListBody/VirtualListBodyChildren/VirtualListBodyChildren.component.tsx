import { InfoBox } from '@repo/ui/components/InfoBox';
import { useVirtualization } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';

import type { VirtualListBodyChildrenProps } from './VirtualListBodyChildren.types';

import {
  useGetContentMode,
  useGetTotalItems,
} from '../../contexts/data/selectors';
import { SkeletonOptions } from '../../SkeletonOptions';
import {
  DEFAULT_CONTAINER_HEIGHT,
  ITEM_HEIGHT,
} from '../../VirtualList.constants';
import { VirtualListBodyOptions } from '../VirtualListBodyOptions';
import { styles } from './VirtualListBodyChildren.stylex';

/**
 * Runs virtualization against the scroll container (Table analog: TableBody)
 * and dispatches by content mode: loading skeleton, empty-state message, or
 * the virtualized options window.
 */
export const VirtualListBodyChildren = ({
  scrollContainerRef,
}: VirtualListBodyChildrenProps) => {
  const contentMode = useGetContentMode();
  const totalItems = useGetTotalItems();

  const { containerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: scrollContainerRef,
      defaultContainerHeight: DEFAULT_CONTAINER_HEIGHT,
      itemHeight: ITEM_HEIGHT,
      overscan: 5,
      totalItems,
    });

  if (contentMode === 'loading') {
    return <SkeletonOptions containerHeight={containerHeight} />;
  }

  if (contentMode === 'empty') {
    return (
      <div {...stylex.props(styles.noResults)}>
        <InfoBox>No options found</InfoBox>
      </div>
    );
  }

  return (
    <VirtualListBodyOptions
      endIndex={endIndex}
      offsetY={offsetY}
      startIndex={startIndex}
      totalHeight={totalHeight}
    />
  );
};
