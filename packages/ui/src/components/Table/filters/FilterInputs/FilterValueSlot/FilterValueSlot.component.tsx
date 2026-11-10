import * as stylex from '@stylexjs/stylex';
import { Activity } from 'react';

import type { FilterValueSlotProps } from './FilterValueSlot.types';

import { styles } from '../FilterInputs.stylex';

export const FilterValueSlot = ({
  children,
  hasFilter,
  isOperatorOpen,
  shouldFillHeight,
}: FilterValueSlotProps) => {
  if (shouldFillHeight) {
    return (
      <Activity mode={isOperatorOpen || !hasFilter ? 'hidden' : undefined}>
        {children}
      </Activity>
    );
  }

  if (!hasFilter) return;

  return (
    <div {...stylex.props(isOperatorOpen && styles.contentHidden)}>
      {children}
    </div>
  );
};
