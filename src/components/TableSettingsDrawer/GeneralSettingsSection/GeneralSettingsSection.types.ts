import type { ComponentPropsWithoutRef } from 'react';

import type {
  ColumnSizingState,
} from '@/components/Table/Table.types';

/**
 * GeneralSettingsSection component props
 */
export type GeneralSettingsSectionProps = ComponentPropsWithoutRef<'div'> & {
  /** Callback when column sizing changes */
  onColumnSizingChange: (columnSizing: ColumnSizingState) => void;
};

/**
 * Width preset options for column sizing
 */
export type WidthPreset = 'default' | 'max' | 'min' | undefined;
