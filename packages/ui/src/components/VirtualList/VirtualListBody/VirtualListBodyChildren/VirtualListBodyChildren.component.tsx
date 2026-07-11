import { InfoBox } from '@repo/ui/components/InfoBox';
import * as stylex from '@stylexjs/stylex';

import type { VirtualListBodyChildrenProps } from './VirtualListBodyChildren.types';

import { SkeletonOptions } from '../../SkeletonOptions';
import { VirtualListBodyOptions } from '../VirtualListBodyOptions';
import { styles } from './VirtualListBodyChildren.stylex';

/**
 * Dispatches the VirtualListBody content by `contentMode`: loading skeleton,
 * empty-state message, or the virtualized options list.
 */
export const VirtualListBodyChildren = ({
  containerHeight,
  contentMode,
  endIndex,
  filteredOptions,
  hasCheckboxes,
  isAllSelected,
  isLoadingOptions,
  offsetY,
  onChange,
  selectedValues,
  shouldShowSelectAll,
  startIndex,
  totalHeight,
}: VirtualListBodyChildrenProps) => {
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
      filteredOptions={filteredOptions}
      hasCheckboxes={hasCheckboxes}
      isAllSelected={isAllSelected}
      isLoadingOptions={isLoadingOptions}
      offsetY={offsetY}
      onChange={onChange}
      selectedValues={selectedValues}
      shouldShowSelectAll={shouldShowSelectAll}
      startIndex={startIndex}
      totalHeight={totalHeight}
    />
  );
};
