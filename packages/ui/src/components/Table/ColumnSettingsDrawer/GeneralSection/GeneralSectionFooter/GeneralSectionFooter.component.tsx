import { Button } from '@repo/ui/components/Button';
import { EraserIcon, RefreshIcon } from '@repo/ui/components/Icons';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

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
      <div {...stylex.props(styles.buttonGroup)}>
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
          onClick={resetAllSettings}
          size='sm'
          width='full'
        >
          Reset All Settings
        </Button>
      </div>
    </SidePanelSection>
  );
};
