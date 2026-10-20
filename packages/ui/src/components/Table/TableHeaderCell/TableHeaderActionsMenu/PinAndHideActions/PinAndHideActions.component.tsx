import { useTableColumnLayoutLock } from '#ui/components/Table/hooks';
import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';

import type { PinAndHideActionsProps } from './PinAndHideActions.types';

import { ColumnPinningButton } from './ColumnPinningButton/ColumnPinningButton.component';
import { HideColumnButton } from './HideColumnButton/HideColumnButton.component';

export const PinAndHideActions = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: PinAndHideActionsProps<TData>) => {
  const layoutLock = useTableColumnLayoutLock<TData>(columnKey);

  return (
    <>
      <ColumnPinningButton
        columnKey={columnKey}
        layoutLock={layoutLock}
        onClose={onClose}
        pinSide={pinSide}
        target='left'
      />
      <ColumnPinningButton
        columnKey={columnKey}
        layoutLock={layoutLock}
        onClose={onClose}
        pinSide={pinSide}
        target='right'
      />
      <ColumnPinningButton
        columnKey={columnKey}
        layoutLock={layoutLock}
        onClose={onClose}
        pinSide={pinSide}
        target='clear'
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
