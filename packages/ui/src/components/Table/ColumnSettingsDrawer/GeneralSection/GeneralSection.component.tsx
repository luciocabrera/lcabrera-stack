import { SidePanelSectionMain } from '#ui/components/SidePanel';

import type { GeneralSectionProps } from './GeneralSection.types';

import { GeneralSectionBody } from './GeneralSectionBody/GeneralSectionBody.component';
import { GeneralSectionFooter } from './GeneralSectionFooter/GeneralSectionFooter.component';
import { GeneralSectionHeader } from './GeneralSectionHeader/GeneralSectionHeader.component';

export const GeneralSection = <TData,>({
  columnKey,
  isBusy = false,
  ...props
}: GeneralSectionProps<TData>) => {
  return (
    <SidePanelSectionMain {...props}>
      <GeneralSectionHeader columnKey={columnKey} isBusy={isBusy} />
      <GeneralSectionBody />
      <GeneralSectionFooter isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
