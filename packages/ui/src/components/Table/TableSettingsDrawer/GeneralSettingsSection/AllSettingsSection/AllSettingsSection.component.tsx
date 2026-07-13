import { ActionButtons } from '@repo/ui/components/ActionButtons';
import { EraserIcon, RefreshIcon } from '@repo/ui/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';

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
            color: 'outline',
            icon: <EraserIcon size={ICON_SIZE_MD} />,
            isBusy,
            label: 'Clear All Settings',
            onClick: clearAllSettings,
            width: 'full',
          },
          {
            color: 'outline',
            icon: <RefreshIcon size={ICON_SIZE_MD} />,
            isBusy,
            label: 'Reset All Settings',
            onClick: resetTableSettings,
            width: 'full',
          },
        ]}
        customStylex={[styles.buttonGroup, styles.generalSection]}
      />
    </SidePanelSection>
  );
};
