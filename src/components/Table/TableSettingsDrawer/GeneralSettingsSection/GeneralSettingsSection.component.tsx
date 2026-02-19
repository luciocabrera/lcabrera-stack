import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { MaximizeIcon, MinimizeIcon, RefreshIcon } from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';

import type {
  GeneralSettingsSectionProps,
  WidthPreset,
} from './GeneralSettingsSection.types';

import { useSetColumnsSizing } from '../TableDrawerContext/hooks/store/columns/actions';
import { styles } from './GeneralSettingsSection.stylex';

export const GeneralSettingsSection = ({
  ...props
}: GeneralSettingsSectionProps) => {
  const columns = useGetColumns();
  const setColumnsSizing = useSetColumnsSizing();

  const [selectedPreset, setSelectedPreset] = useState<WidthPreset>();

  const handleToggle = (preset: 'default' | 'max' | 'min') => {
    const newPreset = selectedPreset === preset ? undefined : preset;
    setSelectedPreset(newPreset);

    if (newPreset === undefined) {
      // Deselected - revert to current state (do nothing)
      return;
    }

    switch (newPreset) {
      case 'default': {
        setColumnsSizing({});

        break;
      }
      case 'max': {
        const newSizing: Record<string, number> = {};
        for (const col of columns) {
          if (col.maxWidth) {
            newSizing[col.key] = col.maxWidth;
          }
        }
        setColumnsSizing(newSizing);

        break;
      }
      case 'min': {
        const newSizing: Record<string, number> = {};
        for (const col of columns) {
          if (col.minWidth) {
            newSizing[col.key] = col.minWidth;
          }
        }
        setColumnsSizing(newSizing);

        break;
      }
      // No default
    }
  };

  const hasMinWidthsConfigured = columns.some((col) => col.minWidth);
  const hasMaxWidthsConfigured = columns.some((col) => col.maxWidth);

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Column Widths</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color={selectedPreset === 'min' ? 'primary' : 'outline'}
            disabled={!hasMinWidthsConfigured}
            icon={<MinimizeIcon size={16} />}
            onClick={() => {
              handleToggle('min');
            }}
            size='sm'
            width='full'
          >
            Set All to Min Width
          </Button>
          <Button
            color={selectedPreset === 'max' ? 'primary' : 'outline'}
            disabled={!hasMaxWidthsConfigured}
            icon={<MaximizeIcon size={16} />}
            onClick={() => {
              handleToggle('max');
            }}
            size='sm'
            width='full'
          >
            Set All to Max Width
          </Button>
          <Button
            color={selectedPreset === 'default' ? 'primary' : 'outline'}
            icon={<RefreshIcon size={16} />}
            onClick={() => {
              handleToggle('default');
            }}
            size='sm'
            width='full'
          >
            Reset to Default Widths
          </Button>
        </div>
      </div>

      <InfoBox>
        Select a preset to adjust all column widths at once. Changes will be
        reflected after clicking Accept.
      </InfoBox>
    </div>
  );
};
