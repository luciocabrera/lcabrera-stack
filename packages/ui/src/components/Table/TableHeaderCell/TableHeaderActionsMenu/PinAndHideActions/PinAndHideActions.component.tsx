import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';

import type { PinAndHideActionsProps } from './PinAndHideActions.types';

import { ClearPinningButton } from './ClearPinningButton/ClearPinningButton.component';
import { HideColumnButton } from './HideColumnButton/HideColumnButton.component';
import { PinLeftButton } from './PinLeftButton/PinLeftButton.component';
import { PinRightButton } from './PinRightButton/PinRightButton.component';

/**
 * Pin/hide section of the column header actions menu (movable columns only) —
 * a thin shell composing the pin-left, pin-right, clear-pinning, and
 * hide-column delegates, with hiding split off below a separator since it is
 * not a pinning choice. Each delegate owns its own store wiring; this shell
 * only forwards `columnKey`, `onClose`, and the current `pinSide`.
 */
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
