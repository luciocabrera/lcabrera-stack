import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '#ui/components/SidePanel';
import {
  deriveToggleCommandState,
  PIN_LEFT_COMMAND,
  PIN_RIGHT_COMMAND,
} from '#ui/components/Table/commands';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableColumnSelectedKey } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { useTableColumnLayoutLock } from '#ui/components/Table/hooks';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { resolveColumnPinningTitle } from '#ui/components/Table/utils/resolveColumnPinningTitle.util';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { PinningSectionProps } from './PinningSection.types';

import { useSetColumnPinning } from '../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../ColumnDrawerContext/selectors';
import { styles } from './PinningSection.stylex';
import { PinningSectionToolbar } from './PinningSectionToolbar';

export const PinningSection = ({ isBusy = false }: PinningSectionProps) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();
  const columnKey = useGetTableColumnSelectedKey();
  const column = useGetNormalizedColumn<Record<string, unknown>>(columnKey);
  const layoutLock =
    useTableColumnLayoutLock<Record<string, unknown>>(columnKey);
  const { isStatic } = resolveColumnCapabilities(column);

  const isPinningLocked = layoutLock === 'group-key';
  const title = resolveColumnPinningTitle(layoutLock);
  const { icon: PinLeftCommandIcon, label: pinLeftLabel } = PIN_LEFT_COMMAND;
  const { icon: PinRightCommandIcon, label: pinRightLabel } = PIN_RIGHT_COMMAND;
  const { isActive: isPinnedLeft, isEnabled: isPinLeftEnabled } =
    deriveToggleCommandState({
      current: columnPinning,
      isDisabled: isStatic || isPinningLocked,
      target: 'left',
    });
  const { isActive: isPinnedRight, isEnabled: isPinRightEnabled } =
    deriveToggleCommandState({
      current: columnPinning,
      isDisabled: isStatic || isPinningLocked,
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
          toolbar={
            <PinningSectionToolbar
              isBusy={isBusy}
              {...(layoutLock !== undefined && { layoutLock })}
              variant='toolbar'
            />
          }
        />
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            icon={<PinLeftCommandIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            isDisabled={!isPinLeftEnabled}
            onClick={handlePinLeft}
            size='sm'
            {...(title !== undefined && { title })}
            variant={isPinnedLeft ? 'primary' : 'outline'}
          >
            {pinLeftLabel}
          </Button>
          <Button
            icon={<PinRightCommandIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            isDisabled={!isPinRightEnabled}
            onClick={handlePinRight}
            size='sm'
            {...(title !== undefined && { title })}
            variant={isPinnedRight ? 'primary' : 'outline'}
          >
            {pinRightLabel}
          </Button>
        </div>
      </SidePanelSection>
      <PinningSectionToolbar
        isBusy={isBusy}
        {...(layoutLock !== undefined && { layoutLock })}
      />
    </SidePanelSectionMain>
  );
};
