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

import {
  useResetTableSettings,
  useSetColumnFilters,
  useSetColumnsSizing,
  useSetColumnsSortings,
} from '../TableDrawerContext/hooks/store/columns/actions';
import {
  useGetColumnFilters,
  useGetColumnOrder,
  useGetColumnsSorting,
} from '../TableDrawerContext/hooks/store/columns/selectors';
import { styles } from './GeneralSettingsSection.stylex';

export const GeneralSettingsSection = ({
  ...props
}: GeneralSettingsSectionProps) => {
  const columns = useGetColumns();
  const columnOrder = useGetColumnOrder();
  const filters = useGetColumnFilters();
  const sorting = useGetColumnsSorting();

  const resetTableSettings = useResetTableSettings();
  const setColumnFilters = useSetColumnFilters();
  const setColumnsSizing = useSetColumnsSizing();
  const setColumnsSortings = useSetColumnsSortings();

  const [selectedPreset, setSelectedPreset] = useState<WidthPreset>();

  const sortableColumns = columns.filter((col) => col.isSortable !== false);
  const hasFilters = Object.keys(filters).length > 0;
  const hasSorting = sorting.length > 0;

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

  const handleResetFilters = () => {
    setColumnFilters({});
  };

  const handleResetSorting = () => {
    setColumnsSortings([]);
  };

  const handleSortByColumnOrder = () => {
    const orderedSortable =
      columnOrder.length > 0
        ? columnOrder
            .map((key) => sortableColumns.find((col) => col.key === key))
            .filter(
              (col): col is (typeof sortableColumns)[0] => col !== undefined,
            )
        : sortableColumns;

    setColumnsSortings(
      orderedSortable.map((col) => ({
        columnKey: col.key,
        direction: 'asc' as const,
      })),
    );
  };

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

      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Filters</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color='outline'
            isDisabled={!hasFilters}
            onClick={handleResetFilters}
            size='sm'
            width='full'
          >
            Reset Filters
          </Button>
        </div>
      </div>

      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Sorting</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color='outline'
            isDisabled={!hasSorting}
            onClick={handleResetSorting}
            size='sm'
            width='full'
          >
            Reset Sorting
          </Button>
          <Button
            color='outline'
            onClick={handleSortByColumnOrder}
            size='sm'
            width='full'
          >
            Sort by Column Order
          </Button>
        </div>
      </div>

      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Reset All</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color='outline'
            onClick={resetTableSettings}
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
