import * as stylex from '@stylexjs/stylex';

import { Checkbox } from '@repo/ui/components/Checkbox';

import type { SelectOptionProps } from './SelectOption.types';

import { skeletonStyles, styles } from '../VirtualList.stylex';

export const SelectOption = ({
  hasCheckbox = true,
  isLoading,
  isSelected,
  onToggle,
  option,
}: SelectOptionProps) => {
  if (!hasCheckbox) {
    return (
      <button
        aria-pressed={isSelected}
        disabled={isLoading}
        onClick={onToggle}
        type='button'
        {...stylex.props(
          styles.option,
          styles.optionButtonReset,
          isLoading && styles.optionDisabled,
        )}
      >
        <span {...stylex.props(styles.label)}>{option}</span>
        {isLoading && (
          <div {...stylex.props(skeletonStyles.loadingOverlay)}>
            <div {...stylex.props(skeletonStyles.shimmerWave)} />
          </div>
        )}
      </button>
    );
  }

  return (
    <label {...stylex.props(styles.option, isLoading && styles.optionDisabled)}>
      {hasCheckbox && (
        <Checkbox
          isChecked={isSelected}
          isDisabled={isLoading}
          onChange={onToggle}
        />
      )}
      <span {...stylex.props(styles.label)}>{option}</span>
      {isLoading && (
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      )}
    </label>
  );
};
