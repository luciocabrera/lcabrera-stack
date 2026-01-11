import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { FilterIcon } from '@/components/Icons';

import type { FilterButtonProps } from './FilterButton.types';

import { styles } from './FilterButton.stylex';

export const FilterButton = ({
  customStylex,
  isActive = false,
  onClick,
  popoverTargetId,
}: FilterButtonProps) => {
  return (
    <Button
      aria-label={isActive ? 'Edit filter' : 'Add filter'}
      customStylex={customStylex as never}
      icon={
        <FilterIcon
          {...stylex.props([styles.icon, isActive && styles.activeIcon])}
        />
      }
      onClick={onClick}
      {...(popoverTargetId
        ? ({ popovertarget: popoverTargetId } as Record<string, unknown>)
        : {})}
      size='sm'
      variant='flat'
      {...stylex.props(styles.button)}
    />
  );
};

FilterButton.displayName = 'FilterButton';
