import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { PinLeftIcon, PinRightIcon } from '@/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@/components/SidePanel';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { PinningSectionProps } from './PinningSection.types';

import { useSetColumnPinning } from '../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../ColumnDrawerContext/selectors';
import { styles } from './PinningSection.stylex';
import { PinningSectionToolbar } from './PinningSectionToolbar';

export const PinningSection = ({ isBusy = false }: PinningSectionProps) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader
          title='Column Pinning'
          toolbar={<PinningSectionToolbar isBusy={isBusy} variant='toolbar' />}
        />
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color={columnPinning === 'left' ? 'primary' : 'outline'}
            icon={<PinLeftIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={() => {
              setColumnPinning(columnPinning === 'left' ? undefined : 'left');
            }}
            size='sm'
            width='full'
          >
            Pin Left
          </Button>
          <Button
            color={columnPinning === 'right' ? 'primary' : 'outline'}
            icon={<PinRightIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={() => {
              setColumnPinning(columnPinning === 'right' ? undefined : 'right');
            }}
            size='sm'
            width='full'
          >
            Pin Right
          </Button>
        </div>
      </SidePanelSection>
      <PinningSectionToolbar isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
