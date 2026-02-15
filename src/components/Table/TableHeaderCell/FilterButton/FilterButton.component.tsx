import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { FilterIcon } from '@/components/Icons';

import type { FilterButtonProps } from './FilterButton.types';

import { styles } from './FilterButton.stylex';

export const FilterButton = ({
  isActive = false,
  popoverTargetId,
  ...rest
}: FilterButtonProps) => {
  return (
    <Button
      aria-label={isActive ? 'Edit filter' : 'Add filter'}
      icon={<FilterIcon {...stylex.props([isActive && styles.activeIcon])} />}
      {...(popoverTargetId
        ? ({ popoverTarget: popoverTargetId } as Record<string, unknown>)
        : {})}
      size='sm'
      variant='flat'
      {...stylex.props(styles.button)}
      {...rest}
    />
  );
};

FilterButton.displayName = 'FilterButton';
