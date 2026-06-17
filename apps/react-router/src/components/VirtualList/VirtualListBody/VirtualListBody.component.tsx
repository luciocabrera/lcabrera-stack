import * as stylex from '@stylexjs/stylex';

import { InfoBox } from '@/components/InfoBox';

import type { VirtualListBodyProps } from './VirtualListBody.types';

import { SkeletonOptions } from '../SkeletonOptions';
import { VirtualizedOption } from '../VirtualizedOption';
import { styles } from './VirtualListBody.stylex';

export const VirtualListBody = ({
  containerHeight,
  endIndex,
  filteredOptions,
  hasCheckboxes,
  isAllSelected,
  isInitialLoading,
  isLoadingOptions,
  listMaxHeight,
  offsetY,
  onSelectAll,
  onToggle,
  scrollContainerRef,
  selectedValues,
  shouldFillHeight,
  shouldShowSelectAll,
  startIndex,
  totalHeight,
}: VirtualListBodyProps) => (
  <div
    {...stylex.props(
      styles.optionsList,
      shouldFillHeight ? styles.optionsListFill : undefined,
    )}
  >
    <div
      ref={scrollContainerRef}
      {...stylex.props(
        shouldFillHeight
          ? styles.virtualContainerFill
          : styles.virtualContainer(listMaxHeight),
      )}
    >
      {isInitialLoading && (
        <SkeletonOptions containerHeight={containerHeight} />
      )}
      {!isInitialLoading && filteredOptions.length === 0 && (
        <div {...stylex.props(styles.noResults)}>
          <InfoBox>No options found</InfoBox>
        </div>
      )}
      {!isInitialLoading && filteredOptions.length > 0 && (
        <div {...stylex.props(styles.virtualScrollArea(totalHeight))}>
          <div {...stylex.props(styles.virtualOffset(offsetY))}>
            {Array.from({ length: endIndex - startIndex }).map((_, i) => {
              const index = startIndex + i;
              let key = `option-${index}`;
              if (index === 0 && shouldShowSelectAll) {
                key = 'select-all';
              } else {
                const optionIndex = shouldShowSelectAll ? index - 1 : index;
                key = filteredOptions[optionIndex] ?? key;
              }

              return (
                <VirtualizedOption
                  filteredOptions={filteredOptions}
                  hasCheckboxes={hasCheckboxes}
                  hasSelectAll={shouldShowSelectAll}
                  index={index}
                  isAllSelected={isAllSelected}
                  isLoading={isLoadingOptions}
                  key={key}
                  onSelectAll={onSelectAll}
                  onToggle={onToggle}
                  selectedValues={selectedValues}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  </div>
);
