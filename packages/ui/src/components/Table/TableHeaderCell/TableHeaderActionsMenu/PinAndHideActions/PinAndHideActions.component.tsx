import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';

import type { PinAndHideActionsProps } from './PinAndHideActions.types';

import { ClearPinningButton } from './ClearPinningButton/ClearPinningButton.component';
import { HideColumnButton } from './HideColumnButton/HideColumnButton.component';
import { PinLeftButton } from './PinLeftButton/PinLeftButton.component';
import { PinRightButton } from './PinRightButton/PinRightButton.component';

export const PinAndHideActions = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: PinAndHideActionsProps<TData>) => (
  <>
    <PinLeftButton columnKey={columnKey} onClose={onClose} pinSide={pinSide} />
    <PinRightButton columnKey={columnKey} onClose={onClose} pinSide={pinSide} />
    <ClearPinningButton
      columnKey={columnKey}
      onClose={onClose}
      pinSide={pinSide}
    />
    <TableActionsPopoverSeparator />
    <HideColumnButton columnKey={columnKey} onClose={onClose} />
  </>
);
