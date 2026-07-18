import { Button } from '@repo/ui/components/Button';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@repo/ui/components/SidePanel';
import {
  deriveToggleCommandState,
  PIN_LEFT_COMMAND,
  PIN_RIGHT_COMMAND,
} from '@repo/ui/components/Table/commands';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import type { PinningSectionProps } from './PinningSection.types';

import { useSetColumnPinning } from '../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../ColumnDrawerContext/selectors';
import { styles } from './PinningSection.stylex';
import { PinningSectionToolbar } from './PinningSectionToolbar';

/**
 * Column-pinning controls in the settings drawer. Identity and active-state come
 * from the shared pinning commands (ADR-011); crucially the active-state is
 * derived from the DRAFT store (`useGetColumnPinning` here reads the drawer's
 * per-column draft, not committed state) so the drawer reflects pending edits
 * while open. This surface owns its draft commit-context and its presentation.
 */
export const PinningSection = ({ isBusy = false }: PinningSectionProps) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();

  const { icon: PinLeftCommandIcon, label: pinLeftLabel } = PIN_LEFT_COMMAND;
  const { icon: PinRightCommandIcon, label: pinRightLabel } = PIN_RIGHT_COMMAND;
  const { isActive: isPinnedLeft } = deriveToggleCommandState({
    current: columnPinning,
    isDisabled: false,
    target: 'left',
  });
  const { isActive: isPinnedRight } = deriveToggleCommandState({
    current: columnPinning,
    isDisabled: false,
    target: 'right',
  });

  const handlePinLeft = () =>
    setColumnPinning(isPinnedLeft ? undefined : 'left');
  const handlePinRight = () =>
    setColumnPinning(isPinnedRight ? undefined : 'right');

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader
          title='Column Pinning'
          toolbar={<PinningSectionToolbar isBusy={isBusy} variant='toolbar' />}
        />
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            icon={<PinLeftCommandIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handlePinLeft}
            size='sm'
            variant={isPinnedLeft ? 'primary' : 'outline'}
          >
            {pinLeftLabel}
          </Button>
          <Button
            icon={<PinRightCommandIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handlePinRight}
            size='sm'
            variant={isPinnedRight ? 'primary' : 'outline'}
          >
            {pinRightLabel}
          </Button>
        </div>
      </SidePanelSection>
      <PinningSectionToolbar isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
