import type { ComponentPropsWithoutRef } from 'react';

import type {
  ColumnSizingState,
  TableColumn,
} from '@/components/Table/Table.types';

/**
 * GeneralSettingsSection component props
 */
export type GeneralSettingsSectionProps = ComponentPropsWithoutRef<'div'> & {
  /** Available table columns */
  columns: TableColumn[];
  /** Callback when column sizing changes */
  onColumnSizingChange: (columnSizing: ColumnSizingState) => void;
};
