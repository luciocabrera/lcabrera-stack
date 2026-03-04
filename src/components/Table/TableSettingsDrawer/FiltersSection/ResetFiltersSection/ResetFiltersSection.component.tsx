import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';

import type { ResetFiltersSectionProps } from './ResetFiltersSection.types';

import { useResetFilters } from '../../TableDrawerContext/actions';
import { styles } from './ResetFiltersSection.stylex';

export const ResetFiltersSection = ({
  isDisabled = false,
  onClearAll,
}: ResetFiltersSectionProps) => {
  const resetFilters = useResetFilters();
  return (
    <div {...stylex.props(styles.container)}>
      <Button
        color='outline'
        isDisabled={isDisabled}
        onClick={onClearAll}
        size='sm'
        width='full'
      >
        Clear Filters
      </Button>
      <Button color='outline' onClick={resetFilters} size='sm' width='full'>
        Reset Filters
      </Button>
    </div>
  );
};

ResetFiltersSection.displayName = 'ResetFiltersSection';
