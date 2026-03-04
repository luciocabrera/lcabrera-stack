import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';

import type { FiltersSectionFooterProps } from './FiltersSectionFooter.types';

import {
  useClearFilters,
  useResetFilters,
} from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { styles } from './FiltersSectionFooter.stylex';

export const FiltersSectionFooter = ({
  onClearAll,
}: FiltersSectionFooterProps) => {
  const filters = useGetColumnFilters();

  const clearFilters = useClearFilters();
  const resetFilters = useResetFilters();

  const hasFilters = Object.keys(filters).length > 0;

  const handleClear = () => {
    clearFilters();
    onClearAll?.();
  };

  return (
    <div {...stylex.props(styles.container)}>
      <Button
        color='outline'
        icon={<EraserIcon size={16} />}
        isDisabled={!hasFilters}
        onClick={handleClear}
        size='sm'
        width='full'
      >
        Clear Filters
      </Button>
      <Button
        color='outline'
        icon={<RefreshIcon size={16} />}
        onClick={resetFilters}
        size='sm'
        width='full'
      >
        Reset Filters
      </Button>
    </div>
  );
};

FiltersSectionFooter.displayName = 'FiltersSectionFooter';
