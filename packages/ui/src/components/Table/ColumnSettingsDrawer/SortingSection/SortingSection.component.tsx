import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '#ui/components/SidePanel';
import {
  deriveToggleCommandState,
  SORT_ASCENDING_COMMAND,
  SORT_DESCENDING_COMMAND,
} from '#ui/components/Table/commands';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { SortingSectionProps } from './SortingSection.types';

import { useSetColumnSorting } from '../ColumnDrawerContext/actions';
import { useGetColumnSorting } from '../ColumnDrawerContext/selectors';
import { styles } from './SortingSection.stylex';
import { SortingSectionToolbar } from './SortingSectionToolbar';

/**
 * Column-sorting controls in the settings drawer. Mirrors `PinningSection`:
 * identity and active-state come from the shared sorting commands (ADR-011), and
 * the active-state is derived from the DRAFT store (`useGetColumnSorting` reads
 * the drawer's per-column draft, not committed state) so the drawer reflects
 * pending edits while open. This surface owns its draft commit-context and its
 * presentation.
 */
export const SortingSection = ({ isBusy = false }: SortingSectionProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();

  const { icon: SortAscendingCommandIcon, label: ascendingLabel } =
    SORT_ASCENDING_COMMAND;
  const { icon: SortDescendingCommandIcon, label: descendingLabel } =
    SORT_DESCENDING_COMMAND;
  const { isActive: isAscending } = deriveToggleCommandState({
    current: sortDirection,
    isDisabled: false,
    target: 'asc',
  });
  const { isActive: isDescending } = deriveToggleCommandState({
    current: sortDirection,
    isDisabled: false,
    target: 'desc',
  });

  const handleAsc = () => {
    setColumnSorting(isAscending ? undefined : 'asc');
  };

  const handleDesc = () => {
    setColumnSorting(isDescending ? undefined : 'desc');
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
            icon={<SortAscendingCommandIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handleAsc}
            size='sm'
            variant={isAscending ? 'primary' : 'outline'}
          >
            {ascendingLabel}
          </Button>
          <Button
            icon={<SortDescendingCommandIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handleDesc}
            size='sm'
            variant={isDescending ? 'primary' : 'outline'}
          >
            {descendingLabel}
          </Button>
        </div>
      </SidePanelSection>
      <SortingSectionToolbar isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
