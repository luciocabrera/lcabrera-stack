import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { SortAscIcon, SortDescIcon } from '@/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@/components/SidePanel';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { SortingSectionProps } from './SortingSection.types';

import { useSetColumnSorting } from '../ColumnDrawerContext/actions';
import { useGetColumnSorting } from '../ColumnDrawerContext/selectors';
import { styles } from './SortingSection.stylex';
import { SortingSectionToolbar } from './SortingSectionToolbar';

export const SortingSection = (_props: SortingSectionProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();

  const handleAsc = () => {
    setColumnSorting(sortDirection === 'asc' ? undefined : 'asc');
  };

  const handleDesc = () => {
    setColumnSorting(sortDirection === 'desc' ? undefined : 'desc');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSection>
        <SidePanelSectionHeader
          title='Column Sorting'
          toolbar={<SortingSectionToolbar variant='toolbar' />}
        />
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
      </SidePanelSection>
      <SortingSectionToolbar />
    </div>
  );
};
