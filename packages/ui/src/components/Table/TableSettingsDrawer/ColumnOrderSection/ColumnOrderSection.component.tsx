import { SidePanelSectionMain } from '#ui/components/SidePanel';

import type { ColumnOrderSectionProps } from './ColumnOrderSection.types';

import { ColumnOrderSectionBody } from './ColumnOrderSectionBody/ColumnOrderSectionBody.component';
import { ColumnOrderSectionHeader } from './ColumnOrderSectionHeader/ColumnOrderSectionHeader.component';
import { ColumnOrderSectionModals } from './ColumnOrderSectionModals/ColumnOrderSectionModals.component';
import { ColumnOrderSectionToolbar } from './ColumnOrderSectionToolbar';

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
