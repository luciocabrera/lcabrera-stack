import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';

import type { ResetFiltersSectionProps } from './ResetFiltersSection.types';

import { styles } from './ResetFiltersSection.stylex';

export const ResetFiltersSection = ({
  onClearAll,
}: ResetFiltersSectionProps) => {
  return (
    <div {...stylex.props(styles.container)}>
      <Button color='outline' onClick={onClearAll} size='sm' width='full'>
        Reset Filters
      </Button>
    </div>
  );
};

ResetFiltersSection.displayName = 'ResetFiltersSection';
