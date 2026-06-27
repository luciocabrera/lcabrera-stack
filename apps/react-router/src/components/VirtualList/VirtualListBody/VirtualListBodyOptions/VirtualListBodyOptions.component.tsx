import * as stylex from '@stylexjs/stylex';

import type { VirtualListBodyOptionsProps } from './VirtualListBodyOptions.types';

import { VirtualizedOption } from '../../VirtualizedOption';
import { styles } from './VirtualListBodyOptions.stylex';

export const VirtualListBodyOptions = ({
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
}: VirtualListBodyOptionsProps) => {
  const handleToggle = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option];

    onChange({ type: 'select', values: newSelectedValues });
  };

  const handleSelectAll = () => {
    const newSelectedValues = isAllSelected
      ? selectedValues.filter((value) => !filteredOptions.includes(value))
      : [...new Set([...selectedValues, ...filteredOptions])];

    onChange({ type: 'select', values: newSelectedValues });
  };

  return (
    <div {...stylex.props(styles.virtualScrollArea(totalHeight))}>
      <div {...stylex.props(styles.virtualOffset(offsetY))}>
        {Array.from({ length: endIndex - startIndex }, (_, i) => {
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
              onSelectAll={handleSelectAll}
              onToggle={handleToggle}
              selectedValues={selectedValues}
            />
          );
        })}
      </div>
    </div>
  );
};
