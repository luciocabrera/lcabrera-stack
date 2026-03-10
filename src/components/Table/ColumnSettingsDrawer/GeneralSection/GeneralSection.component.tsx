import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import {
  EraserIcon,
  MaximizeIcon,
  MinimizeIcon,
  PinIcon,
  PinOffIcon,
  RefreshIcon,
} from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { GeneralSectionProps, WidthPreset } from './GeneralSection.types';

import {
  useClearAllColumnDrawerSettings,
  useResetAllColumnDrawerSettings,
  useSetColumnPinning,
  useSetColumnSizing,
} from '../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../ColumnDrawerContext/selectors';
import { styles } from './GeneralSection.stylex';

export const GeneralSection = <TData,>({
  columnKey,
}: GeneralSectionProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();
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
            icon={<MinimizeIcon size={ICON_SIZE_MD} />}
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
            icon={<MaximizeIcon size={ICON_SIZE_MD} />}
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
            icon={<RefreshIcon size={ICON_SIZE_MD} />}
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
        <h3 {...stylex.props(styles.sectionTitle)}>Column Pinning</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color={columnPinning === 'left' ? 'primary' : 'outline'}
            icon={<PinIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              setColumnPinning(columnPinning === 'left' ? undefined : 'left');
            }}
            size='sm'
            width='full'
          >
            Pin Left
          </Button>
          <Button
            color={columnPinning === 'right' ? 'primary' : 'outline'}
            icon={<PinIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              setColumnPinning(columnPinning === 'right' ? undefined : 'right');
            }}
            size='sm'
            width='full'
          >
            Pin Right
          </Button>
          <Button
            color='outline'
            disabled={columnPinning === undefined}
            icon={<PinOffIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              setColumnPinning(undefined);
            }}
            size='sm'
            width='full'
          >
            Unpin
          </Button>
        </div>
      </div>

      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>All Settings</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color='outline'
            icon={<EraserIcon size={ICON_SIZE_MD} />}
            onClick={clearAllSettings}
            size='sm'
            width='full'
          >
            Clear All Settings
          </Button>
          <Button
            color='outline'
            icon={<RefreshIcon size={ICON_SIZE_MD} />}
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
