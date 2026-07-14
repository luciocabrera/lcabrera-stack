import type { PinAndHideActionsProps } from './PinAndHideActions.types';

import { ClearPinningButton } from './ClearPinningButton/ClearPinningButton.component';
import { HideColumnButton } from './HideColumnButton/HideColumnButton.component';
import { PinLeftButton } from './PinLeftButton/PinLeftButton.component';
import { PinRightButton } from './PinRightButton/PinRightButton.component';

/**
 * Pin/hide section of the column header actions menu (movable columns only) —
 * a thin shell composing the pin-left, pin-right, clear-pinning, and
 * hide-column delegates. Each delegate owns its own store wiring; this shell
 * only forwards `columnKey`, `onClose`, the current `pinSide`, and
 * `hasSectionAbove` (which drives the "Pin Left" divider).
 */
export const PinAndHideActions = <TData,>({
  columnKey,
  hasSectionAbove = false,
  onClose,
  pinSide,
}: PinAndHideActionsProps<TData>) => (
  <>
    <PinLeftButton
      columnKey={columnKey}
      hasSectionAbove={hasSectionAbove}
      onClose={onClose}
      pinSide={pinSide}
    />
    <PinRightButton columnKey={columnKey} onClose={onClose} pinSide={pinSide} />
    <ClearPinningButton
      columnKey={columnKey}
      onClose={onClose}
      pinSide={pinSide}
    />
    <HideColumnButton columnKey={columnKey} onClose={onClose} />
  </>
);
