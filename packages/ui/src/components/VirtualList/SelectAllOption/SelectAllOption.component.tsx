import * as stylex from '@stylexjs/stylex';

import { Checkbox } from '#ui/components/Checkbox';

import type { SelectAllOptionProps } from './SelectAllOption.types';

import { skeletonStyles, styles } from '../VirtualList.stylex';

export const SelectAllOption = ({
  isAllSelected,
  isLoading,
  onSelectAll,
}: SelectAllOptionProps) => (
  <label {...stylex.props(styles.option, isLoading && styles.optionDisabled)}>
    <Checkbox
      isChecked={isAllSelected}
      isDisabled={isLoading}
      onChange={onSelectAll}
    />
    <span {...stylex.props(styles.label)}>
      {isAllSelected ? 'Deselect All' : 'Select All'}
    </span>
    {Boolean(isLoading) && (
      <div {...stylex.props(skeletonStyles.loadingOverlay)}>
        <div {...stylex.props(skeletonStyles.shimmerWave)} />
      </div>
    )}
  </label>
);
