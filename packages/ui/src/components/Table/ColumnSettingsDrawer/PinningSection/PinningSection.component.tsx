import { Button } from '@repo/ui/components/Button';
import { PinLeftIcon, PinRightIcon } from '@repo/ui/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@repo/ui/components/SidePanel';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import type { PinningSectionProps } from './PinningSection.types';

import { useSetColumnPinning } from '../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../ColumnDrawerContext/selectors';
import { styles } from './PinningSection.stylex';
import { PinningSectionToolbar } from './PinningSectionToolbar';

export const PinningSection = ({ isBusy = false }: PinningSectionProps) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();

  const handlePinLeft = () =>
    setColumnPinning(columnPinning === 'left' ? undefined : 'left');
  const handlePinRight = () =>
    setColumnPinning(columnPinning === 'right' ? undefined : 'right');

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader
          title='Column Pinning'
          toolbar={<PinningSectionToolbar isBusy={isBusy} variant='toolbar' />}
        />
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            variant={columnPinning === 'left' ? 'primary' : 'outline'}
            icon={<PinLeftIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handlePinLeft}
            size='sm'
          >
            Pin Left
          </Button>
          <Button
            variant={columnPinning === 'right' ? 'primary' : 'outline'}
            icon={<PinRightIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handlePinRight}
            size='sm'
          >
            Pin Right
          </Button>
        </div>
      </SidePanelSection>
      <PinningSectionToolbar isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
