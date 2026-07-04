import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { WidthPreset } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';

import { Button } from '@repo/ui/components/Button';
import { EraserIcon, RefreshIcon } from '@repo/ui/components/Icons';
import { InfoBox } from '@repo/ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@repo/ui/components/SidePanel';
import { useGetNormalizedColumn } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { ColumnWidthPresetButtons } from '@repo/ui/components/Table/shared/ColumnWidthPresetButtons';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@repo/ui/components/Table/Table.constants';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';

import type { GeneralSectionProps } from './GeneralSection.types';

import {
  useClearAllColumnDrawerSettings,
  useResetAllColumnDrawerSettings,
  useSetColumnSizing,
} from '../ColumnDrawerContext/actions';
import { styles } from './GeneralSection.stylex';

export const GeneralSection = <TData,>({
  columnKey,
  isBusy = false,
}: GeneralSectionProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);

  const setColumnSizing = useSetColumnSizing();
  const clearAllSettings = useClearAllColumnDrawerSettings();
  const resetAllSettings = useResetAllColumnDrawerSettings();

  const [selectedPreset, setSelectedPreset] = useState<WidthPreset>();

  const { maxWidth, minWidth } = column;
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const effectiveMaxWidth = maxWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const hasMinWidth = column.minWidth !== undefined;
  const hasMaxWidth = column.maxWidth !== undefined;

  const handleToggle = (preset: 'default' | 'max' | 'min') => {
    const newPreset = selectedPreset === preset ? undefined : preset;
    setSelectedPreset(newPreset);

    if (newPreset === undefined) {
      // Deselected — revert to current state (do nothing)
      return;
    }

    switch (newPreset) {
      case 'default': {
        setColumnSizing();

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
    }
  };

  const handleToggleDefault = () => handleToggle('default');
  const handleToggleMax = () => handleToggle('max');
  const handleToggleMin = () => handleToggle('min');

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader title='Column Width' />
        <div {...stylex.props(styles.buttonGroup)}>
          <ColumnWidthPresetButtons
            isBusy={isBusy}
            isMaxDisabled={!hasMaxWidth}
            isMinDisabled={!hasMinWidth}
            onToggleDefault={handleToggleDefault}
            onToggleMax={handleToggleMax}
            onToggleMin={handleToggleMin}
            selectedPreset={selectedPreset}
          />
        </div>
      </SidePanelSection>

      <InfoBox>
        Select a preset to adjust this column&apos;s width. Changes will be
        reflected after clicking Accept.
      </InfoBox>

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
    </SidePanelSectionMain>
  );
};
