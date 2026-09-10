import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { DataKey, TableColumn } from '#ui/components/Table/Table.types';

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> & {
  readonly column?: TableColumn<TData>;
  readonly columnKey: DataKey<TData>;
  readonly customStylex?: StyleXStyles;
  readonly hasSettings?: boolean;
  readonly isLoadingState?: boolean;
};
