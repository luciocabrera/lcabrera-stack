import { useTableColumnLayoutLock } from '#ui/components/Table/hooks';
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
}: PinAndHideActionsProps<TData>) => {
  const layoutLock = useTableColumnLayoutLock<TData>(columnKey);

  return (
    <>
      <PinLeftButton
        columnKey={columnKey}
        layoutLock={layoutLock}
        onClose={onClose}
        pinSide={pinSide}
      />
      <PinRightButton
        columnKey={columnKey}
        layoutLock={layoutLock}
        onClose={onClose}
        pinSide={pinSide}
      />
      <ClearPinningButton
        columnKey={columnKey}
        layoutLock={layoutLock}
        onClose={onClose}
        pinSide={pinSide}
      />
      <TableActionsPopoverSeparator />
      <HideColumnButton
        columnKey={columnKey}
        layoutLock={layoutLock}
        onClose={onClose}
      />
    </>
  );
};
