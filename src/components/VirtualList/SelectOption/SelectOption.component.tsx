import * as stylex from '@stylexjs/stylex';

import type { SelectOptionProps } from './SelectOption.types';

import { skeletonStyles, styles } from '../VirtualList.stylex';

export const SelectOption = ({
  hasCheckbox = true,
  isLoading,
  isSelected,
  onToggle,
  option,
}: SelectOptionProps) => (
  <label
    onClick={hasCheckbox ? undefined : onToggle}
    {...stylex.props(styles.option, isLoading && styles.optionDisabled)}
  >
    {hasCheckbox && (
      <input
        checked={isSelected}
        disabled={isLoading}
        onChange={onToggle}
        type='checkbox'
        {...stylex.props(styles.checkbox)}
      />
    )}
    <span {...stylex.props(styles.label)}>
      {option}
    </span>
    {isLoading && (
      <div {...stylex.props(skeletonStyles.loadingOverlay)}>
        <div {...stylex.props(skeletonStyles.shimmerWave)} />
      </div>
    )}
  </label>
);
