import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { DataKey, PinnedColumnInfo } from '@/components/Table/Table.types';

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> & {
  readonly columnKey: DataKey<TData>;
  readonly customStylex?: StyleXStyles;
  readonly hasSettings?: boolean;
  readonly isLoadingState?: boolean;
  readonly pinInfo?: PinnedColumnInfo;
};
