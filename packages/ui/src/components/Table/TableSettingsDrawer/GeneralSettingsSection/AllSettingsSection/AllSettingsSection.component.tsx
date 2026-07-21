import { ActionButtons } from '@lcabrera/ui/components/ActionButtons';
import { EraserIcon, RefreshIcon } from '@lcabrera/ui/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@lcabrera/ui/components/SidePanel';
import { ICON_SIZE_MD } from '@lcabrera/ui/design-system/constants';

import type { AllSettingsSectionProps } from './AllSettingsSection.types';

import {
  useClearAllSettings,
  useResetTableSettings,
} from '../../TableDrawerContext/actions';
import { styles } from './AllSettingsSection.stylex';

/**
 * "All Settings" section of the general settings tab: cross-section bulk
 * actions that clear every drawer setting or reset them all from the current
 * table state.
 */
export const AllSettingsSection = ({
  isBusy = false,
}: AllSettingsSectionProps) => {
  const clearAllSettings = useClearAllSettings();
  const resetTableSettings = useResetTableSettings();

  return (
    <SidePanelSection>
      <SidePanelSectionHeader title='All Settings' />
      <ActionButtons
        actions={[
          {
            icon: <EraserIcon size={ICON_SIZE_MD} />,
            label: 'Clear All Settings',
            onClick: clearAllSettings,
          },
          {
            icon: <RefreshIcon size={ICON_SIZE_MD} />,
            label: 'Reset All Settings',
            onClick: resetTableSettings,
          },
        ]}
        customStylex={[styles.buttonGroup, styles.generalSection]}
        isBusy={isBusy}
      />
    </SidePanelSection>
  );
};
