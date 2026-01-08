import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import {
  MaximizeIcon,
  MinimizeIcon,
  RefreshIcon,
} from '@/components/Icons';

import type { GeneralSettingsSectionProps } from './GeneralSettingsSection.types';

import { styles } from './GeneralSettingsSection.stylex';

export const GeneralSettingsSection = ({
  columns,
  onColumnSizingChange,
  ...props
}: GeneralSettingsSectionProps) => {
  const handleSetMinWidths = () => {
    const newSizing: Record<string, number> = {};
    for (const col of columns) {
      if (col.minWidth) {
        newSizing[col.key] = col.minWidth;
      }
    }
    onColumnSizingChange(newSizing);
  };

  const handleSetMaxWidths = () => {
    const newSizing: Record<string, number> = {};
    for (const col of columns) {
      if (col.maxWidth) {
        newSizing[col.key] = col.maxWidth;
      }
    }
    onColumnSizingChange(newSizing);
  };

  const handleResetToDefault = () => {
    // Reset all column widths (empty object means use default widths)
    onColumnSizingChange({});
  };

  const hasMinWidthsConfigured = columns.some((col) => col.minWidth);
  const hasMaxWidthsConfigured = columns.some((col) => col.maxWidth);

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Column Widths</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color='outline'
            disabled={!hasMinWidthsConfigured}
            icon={<MinimizeIcon size={16} />}
            onClick={handleSetMinWidths}
            size='sm'
            width='full'
          >
            Set All to Min Width
          </Button>
          <Button
            color='outline'
            disabled={!hasMaxWidthsConfigured}
            icon={<MaximizeIcon size={16} />}
            onClick={handleSetMaxWidths}
            size='sm'
            width='full'
          >
            Set All to Max Width
          </Button>
          <Button
            color='outline'
            icon={<RefreshIcon size={16} />}
            onClick={handleResetToDefault}
            size='sm'
            width='full'
          >
            Reset to Default Widths
          </Button>
        </div>
      </div>

      <div {...stylex.props(styles.infoBox)}>
        Apply these settings to quickly adjust all column widths at once. Changes
        will be reflected after clicking Accept.
      </div>
    </div>
  );
};
