import { SidePanelSectionMain } from '@lcabrera/ui/components/SidePanel';

import type { ColumnOrderSectionProps } from './ColumnOrderSection.types';

import { ColumnOrderSectionBody } from './ColumnOrderSectionBody/ColumnOrderSectionBody.component';
import { ColumnOrderSectionHeader } from './ColumnOrderSectionHeader/ColumnOrderSectionHeader.component';
import { ColumnOrderSectionModals } from './ColumnOrderSectionModals/ColumnOrderSectionModals.component';
import { ColumnOrderSectionToolbar } from './ColumnOrderSectionToolbar';

/**
 * Drawer section for column ordering, visibility, and pinning; a thin shell
 * composing private delegates that own their store wiring: a header (count
 * title + compact toolbar), a body (drag-and-drop column list), a footer
 * toolbar, and the pin/order conflict-resolution modals.
 */
export const ColumnOrderSection = ({
  isBusy = false,
  ...props
}: ColumnOrderSectionProps) => {
  return (
    <SidePanelSectionMain {...props}>
      <ColumnOrderSectionHeader isBusy={isBusy} />
      <ColumnOrderSectionBody isBusy={isBusy} />
      <ColumnOrderSectionToolbar isBusy={isBusy} />
      <ColumnOrderSectionModals />
    </SidePanelSectionMain>
  );
};
