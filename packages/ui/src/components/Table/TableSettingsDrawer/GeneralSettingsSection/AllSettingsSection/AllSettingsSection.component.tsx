import { Button } from '@repo/ui/components/Button';
import { EraserIcon, RefreshIcon } from '@repo/ui/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

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
      <div {...stylex.props(styles.buttonGroup, styles.generalSection)}>
        <Button
          color='outline'
          icon={<EraserIcon size={ICON_SIZE_MD} />}
          isBusy={isBusy}
          onClick={clearAllSettings}
          size='sm'
          width='full'
        >
          Clear All Settings
        </Button>
        <Button
          color='outline'
          icon={<RefreshIcon size={ICON_SIZE_MD} />}
          isBusy={isBusy}
          onClick={resetTableSettings}
          size='sm'
          width='full'
        >
          Reset All Settings
        </Button>
      </div>
    </SidePanelSection>
  );
};
