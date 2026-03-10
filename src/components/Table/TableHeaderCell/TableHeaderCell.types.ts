import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { DataKey, PinnedColumnInfo } from '@/components/Table/Table.types';

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> & {
  columnKey: DataKey<TData>;
  customStylex?: StyleXStyles;
  hasSettings?: boolean;
  pinInfo?: PinnedColumnInfo;
};
