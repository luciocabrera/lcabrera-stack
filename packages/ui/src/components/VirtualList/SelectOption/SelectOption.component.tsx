import { Checkbox } from '@repo/ui/components/Checkbox';
import * as stylex from '@stylexjs/stylex';

import type { SelectOptionProps } from './SelectOption.types';

import { skeletonStyles, styles } from '../VirtualList.stylex';

export const SelectOption = ({
  hasCheckbox = true,
  isLoading,
  isSelected,
  onToggle,
  option,
}: SelectOptionProps) => {
  const content = (
    <>
      <span {...stylex.props(styles.label)}>{option}</span>
      {isLoading && (
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      )}
    </>
  );

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
        {content}
      </button>
    );
  }

  return (
    <label {...stylex.props(styles.option, isLoading && styles.optionDisabled)}>
      <Checkbox
        isChecked={isSelected}
        isDisabled={isLoading}
        onChange={onToggle}
      />
      {content}
    </label>
  );
};
