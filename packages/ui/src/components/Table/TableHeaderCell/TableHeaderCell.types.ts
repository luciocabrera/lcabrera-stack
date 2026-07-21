import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> & {
  readonly columnKey: DataKey<TData>;
  readonly customStylex?: StyleXStyles;
  readonly hasSettings?: boolean;
  readonly isLoadingState?: boolean;
};
