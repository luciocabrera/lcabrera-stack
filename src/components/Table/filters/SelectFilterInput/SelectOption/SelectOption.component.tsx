import * as stylex from '@stylexjs/stylex';

import type { SelectOptionProps } from './SelectOption.types';

import { skeletonStyles, styles } from '../SelectFilterInput.stylex';

export const SelectOption = ({
  isLoading,
  isSelected,
  onToggle,
  option,
}: SelectOptionProps) => (
  <label {...stylex.props(styles.option)}>
    <input
      checked={isSelected}
      onChange={onToggle}
      type='checkbox'
      {...stylex.props(styles.checkbox)}
    />
    <span {...stylex.props(styles.label)}>{option}</span>
    {isLoading && (
      <div {...stylex.props(skeletonStyles.loadingOverlay)}>
        <div {...stylex.props(skeletonStyles.shimmerWave)} />
      </div>
    )}
  </label>
);
