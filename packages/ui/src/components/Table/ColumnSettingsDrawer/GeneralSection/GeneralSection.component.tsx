import { SidePanelSectionMain } from '#ui/components/SidePanel';

import type { GeneralSectionProps } from './GeneralSection.types';

import { GeneralSectionBody } from './GeneralSectionBody/GeneralSectionBody.component';
import { GeneralSectionFooter } from './GeneralSectionFooter/GeneralSectionFooter.component';
import { GeneralSectionHeader } from './GeneralSectionHeader/GeneralSectionHeader.component';

/**
 * "General" tab of the column settings drawer; a thin shell composing private
 * delegates that own their store wiring: a header (per-column width preset
 * toggles), a body (preset guidance), and a footer (cross-section
 * clear/reset-all actions).
 */
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
