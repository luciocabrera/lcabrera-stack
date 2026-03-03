import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { SortAscIcon, SortClearIcon, SortDescIcon } from '@/components/Icons';

import type { SortingSectionProps } from './SortingSection.types';

import { useSetColumnSorting } from '../ColumnDrawerContext/columns/actions';
import { useGetColumnSorting } from '../ColumnDrawerContext/columns/selectors';
import { styles } from './SortingSection.stylex';

export const SortingSection = (_props: SortingSectionProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();

  const handleAsc = () => {
    setColumnSorting(sortDirection === 'asc' ? undefined : 'asc');
  };

  const handleDesc = () => {
    setColumnSorting(sortDirection === 'desc' ? undefined : 'desc');
  };

  const handleClear = () => {
    setColumnSorting(undefined);
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
