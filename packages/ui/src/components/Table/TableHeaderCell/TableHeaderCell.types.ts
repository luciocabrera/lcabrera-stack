import type {
  DataKey,
  PinnedColumnInfo,
} from '@repo/ui/components/Table/Table.types';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> & {
  readonly columnKey: DataKey<TData>;
  readonly customStylex?: StyleXStyles;
  readonly hasSettings?: boolean;
  readonly isLoadingState?: boolean;
  readonly pinInfo?: PinnedColumnInfo;
};
