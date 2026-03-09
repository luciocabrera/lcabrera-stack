import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import {
  EraserIcon,
  MaximizeIcon,
  MinimizeIcon,
  RefreshIcon,
} from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';

import type { GeneralSectionProps, WidthPreset } from './GeneralSection.types';

import {
  useClearAllColumnDrawerSettings,
  useResetAllColumnDrawerSettings,
  useSetColumnSizing,
} from '../ColumnDrawerContext/actions';
import { styles } from './GeneralSection.stylex';

export const GeneralSection = <TData,>({
  columnKey,
}: GeneralSectionProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const setColumnSizing = useSetColumnSizing();
  const clearAllSettings = useClearAllColumnDrawerSettings();
  const resetAllSettings = useResetAllColumnDrawerSettings();

  const { maxWidth, minWidth } = column;

  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const effectiveMaxWidth = maxWidth ?? DEFAULT_MIN_COLUMN_WIDTH;

  const [selectedPreset, setSelectedPreset] = useState<WidthPreset>();

  const handleToggle = (preset: 'default' | 'max' | 'min') => {
    const newPreset = selectedPreset === preset ? undefined : preset;
    setSelectedPreset(newPreset);

    if (newPreset === undefined) {
      // Deselected — revert to current state (do nothing)
      return;
    }

    switch (newPreset) {
      case 'default': {
        setColumnSizing(undefined);

        break;
      }
      case 'max': {
        setColumnSizing(effectiveMaxWidth);

        break;
      }
      case 'min': {
        setColumnSizing(effectiveMinWidth);

        break;
      }
      // No default
    }
  };

  const hasMinWidth = column.minWidth !== undefined;
  const hasMaxWidth = column.maxWidth !== undefined;

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Column Width</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color={selectedPreset === 'min' ? 'primary' : 'outline'}
            disabled={!hasMinWidth}
            icon={<MinimizeIcon size={16} />}
            onClick={() => {
              handleToggle('min');
            }}
            size='sm'
            width='full'
          >
            Set to Min Width
          </Button>
          <Button
            color={selectedPreset === 'max' ? 'primary' : 'outline'}
            disabled={!hasMaxWidth}
            icon={<MaximizeIcon size={16} />}
            onClick={() => {
              handleToggle('max');
            }}
            size='sm'
            width='full'
          >
            Set to Max Width
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
            Reset to Default Width
          </Button>
        </div>
      </div>

      <InfoBox>
        Select a preset to adjust this column's width. Changes will be reflected
        after clicking Accept.
      </InfoBox>

      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>All Settings</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color='outline'
            icon={<EraserIcon size={16} />}
            onClick={clearAllSettings}
            size='sm'
            width='full'
          >
            Clear All Settings
          </Button>
          <Button
            color='outline'
            icon={<RefreshIcon size={16} />}
            onClick={resetAllSettings}
            size='sm'
            width='full'
          >
            Reset All Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
