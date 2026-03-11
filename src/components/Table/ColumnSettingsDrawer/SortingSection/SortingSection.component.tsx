import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon, SortAscIcon, SortDescIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { SortingSectionProps } from './SortingSection.types';

import {
  useResetColumnSorting,
  useSetColumnSorting,
} from '../ColumnDrawerContext/actions';
import { useGetColumnSorting } from '../ColumnDrawerContext/selectors';
import { styles } from './SortingSection.stylex';

export const SortingSection = (_props: SortingSectionProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();
  const resetColumnSorting = useResetColumnSorting();

  const hasSorting = sortDirection !== undefined;

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
      <div {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.headerRow)}>
          <h3 {...stylex.props(styles.headerTitle)}>Column Sorting</h3>
          <div {...stylex.props(styles.headerToolbar)}>
            <Button
              aria-label='Clear Sorting'
              color='ghost'
              icon={<EraserIcon size={ICON_SIZE_SM} />}
              isDisabled={!hasSorting}
              onClick={handleClear}
              size='mini'
              width='auto'
            />
            <Button
              aria-label='Reset Sorting'
              color='ghost'
              icon={<RefreshIcon size={ICON_SIZE_SM} />}
              onClick={resetColumnSorting}
              size='mini'
              width='auto'
            />
          </div>
        </div>
        <div {...stylex.props(styles.list)}>
        <Button
          color={sortDirection === 'asc' ? 'primary' : 'outline'}
          icon={<SortAscIcon size={ICON_SIZE_MD} />}
          onClick={handleAsc}
          size='sm'
          width='full'
        >
          Ascending
        </Button>
        <Button
          color={sortDirection === 'desc' ? 'primary' : 'outline'}
          icon={<SortDescIcon size={ICON_SIZE_MD} />}
          onClick={handleDesc}
          size='sm'
          width='full'
        >
          Descending
        </Button>
        </div>
      </div>
      <div {...stylex.props(styles.resetSection)}>
        <Button
          color='outline'
          icon={<EraserIcon size={ICON_SIZE_MD} />}
          isDisabled={!hasSorting}
          onClick={handleClear}
          size='sm'
          width='full'
        >
          Clear Sorting
        </Button>
        <Button
          color='outline'
          icon={<RefreshIcon size={ICON_SIZE_MD} />}
          onClick={resetColumnSorting}
          size='sm'
          width='full'
        >
          Reset Sorting
        </Button>
      </div>
    </div>
  );
};
