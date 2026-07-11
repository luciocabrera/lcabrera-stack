import { Button } from '@repo/ui/components/Button';
import {
  EyeOffIcon,
  PinLeftIcon,
  PinRightIcon,
} from '@repo/ui/components/Icons';
import {
  useSetColumnPinning,
  useSetColumnVisibility,
} from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { PinAndHideActionsProps } from './PinAndHideActions.types';

/**
 * Pin/hide section of the column header actions menu (movable columns only):
 * "Pin Left" and "Pin Right" toggle their side on/off, and "Hide Column"
 * hides the column at table level. Every action closes the menu via
 * `onClose`.
 */
export const PinAndHideActions = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: PinAndHideActionsProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const setColumnVisibility = useSetColumnVisibility<TData>();

  const handlePinLeft = () => {
    setColumnPinning({
      columnKey,
      side: pinSide === 'left' ? undefined : 'left',
    });
    onClose();
  };

  const handlePinRight = () => {
    setColumnPinning({
      columnKey,
      side: pinSide === 'right' ? undefined : 'right',
    });
    onClose();
  };

  const handleHideColumn = () => {
    setColumnVisibility({ columnKey, isVisible: false });
    onClose();
  };

  return (
    <>
      <Button
        color='ghost'
        customStylex={tableActionsPopoverStyles.menuItem}
        icon={
          <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
            <PinLeftIcon size={16} />
          </span>
        }
        onClick={handlePinLeft}
        orientation='horizontal'
        size='mini'
        width='full'
      >
        Pin Left
      </Button>
      <Button
        color='ghost'
        customStylex={tableActionsPopoverStyles.menuItem}
        icon={
          <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
            <PinRightIcon size={16} />
          </span>
        }
        onClick={handlePinRight}
        orientation='horizontal'
        size='mini'
        width='full'
      >
        Pin Right
      </Button>
      <Button
        color='ghost'
        customStylex={tableActionsPopoverStyles.menuItem}
        icon={
          <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
            <EyeOffIcon size={16} />
          </span>
        }
        onClick={handleHideColumn}
        orientation='horizontal'
        size='mini'
        width='full'
      >
        Hide Column
      </Button>
    </>
  );
};
