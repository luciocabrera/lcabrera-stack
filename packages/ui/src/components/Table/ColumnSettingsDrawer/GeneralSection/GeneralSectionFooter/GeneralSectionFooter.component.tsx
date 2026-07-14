import { ActionButtons } from '@repo/ui/components/ActionButtons';
import { EraserIcon, RefreshIcon } from '@repo/ui/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';

import type { GeneralSectionFooterProps } from './GeneralSectionFooter.types';

import {
  useClearAllColumnDrawerSettings,
  useResetAllColumnDrawerSettings,
} from '../../ColumnDrawerContext/actions';
import { styles } from './GeneralSectionFooter.stylex';

/**
 * Footer of the general section: cross-section bulk actions that clear every
 * drawer setting for the column or reset them all from the current table
 * state.
 */
export const GeneralSectionFooter = ({
  isBusy = false,
}: GeneralSectionFooterProps) => {
  const clearAllSettings = useClearAllColumnDrawerSettings();
  const resetAllSettings = useResetAllColumnDrawerSettings();

  return (
    <SidePanelSection>
      <SidePanelSectionHeader title='All Settings' />
      <ActionButtons
        actions={[
          {
            color: 'outline',
            icon: <EraserIcon size={ICON_SIZE_MD} />,
            label: 'Clear All Settings',
            onClick: clearAllSettings,
          },
          {
            color: 'outline',
            icon: <RefreshIcon size={ICON_SIZE_MD} />,
            label: 'Reset All Settings',
            onClick: resetAllSettings,
          },
        ]}
        customStylex={styles.buttonGroup}
        isBusy={isBusy}
      />
    </SidePanelSection>
  );
};
