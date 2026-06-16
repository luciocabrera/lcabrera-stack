import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { SortAscIcon, SortDescIcon } from '@/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@/components/SidePanel';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { SortingSectionProps } from './SortingSection.types';

import { useSetColumnSorting } from '../ColumnDrawerContext/actions';
import { useGetColumnSorting } from '../ColumnDrawerContext/selectors';
import { styles } from './SortingSection.stylex';
import { SortingSectionToolbar } from './SortingSectionToolbar';

export const SortingSection = ({ isBusy = false }: SortingSectionProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();

  const handleAsc = () => {
    setColumnSorting(sortDirection === 'asc' ? undefined : 'asc');
  };

  const handleDesc = () => {
    setColumnSorting(sortDirection === 'desc' ? undefined : 'desc');
  };

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader
          title='Column Sorting'
          toolbar={<SortingSectionToolbar isBusy={isBusy} variant='toolbar' />}
        />
        <div {...stylex.props(styles.list)}>
          <Button
            color={sortDirection === 'asc' ? 'primary' : 'outline'}
            icon={<SortAscIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handleAsc}
            size='sm'
            width='full'
          >
            Ascending
          </Button>
          <Button
            color={sortDirection === 'desc' ? 'primary' : 'outline'}
            icon={<SortDescIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handleDesc}
            size='sm'
            width='full'
          >
            Descending
          </Button>
        </div>
      </SidePanelSection>
      <SortingSectionToolbar isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
