import * as stylex from '@stylexjs/stylex';

import type { SortDirection } from '@/types/ui.types';

import { Button } from '@/components/Button';
import { SortAscIcon, SortClearIcon, SortDescIcon } from '@/components/Icons';

import type { SortingSectionProps } from './SortingSection.types';

import { useSetColumnsSortings } from '../ColumnDrawerContext/hooks/store/columns/actions';
import { useColumnsStore } from '../ColumnDrawerContext/hooks/store/columns/useColumnsStore.hook';
import { styles } from './SortingSection.stylex';

export const SortingSection = <TData,>({
  columnKey,
}: SortingSectionProps<TData>) => {
  const sortDirection = useColumnsStore<SortDirection>(
    (state) => state.sorting.direction,
  );
  const setColumnsSortings = useSetColumnsSortings();

  const handleAsc = () => {
    setColumnsSortings({
      columnKey,
      direction: sortDirection === 'asc' ? undefined : 'asc',
    });
  };

  const handleDesc = () => {
    setColumnsSortings({
      columnKey,
      direction: sortDirection === 'desc' ? undefined : 'desc',
    });
  };

  const handleClear = () => {
    setColumnsSortings({ columnKey, direction: undefined });
  };

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.list)}>
        <Button
          color={sortDirection === 'asc' ? 'primary' : 'outline'}
          icon={<SortAscIcon size={16} />}
          onClick={handleAsc}
          size='sm'
          width='full'
        >
          Ascending
        </Button>
        <Button
          color={sortDirection === 'desc' ? 'primary' : 'outline'}
          icon={<SortDescIcon size={16} />}
          onClick={handleDesc}
          size='sm'
          width='full'
        >
          Descending
        </Button>
        <Button
          color='outline'
          icon={<SortClearIcon size={16} />}
          isDisabled={sortDirection === undefined}
          onClick={handleClear}
          size='sm'
          width='full'
        >
          Clear Sorting
        </Button>
      </div>
    </div>
  );
};
