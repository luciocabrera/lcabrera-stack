import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { DataKey } from '#ui/components/Table/Table.types';

import type { TableHeaderActionsMenuProps } from './TableHeaderActionsMenu/TableHeaderActionsMenu.types';

export type TableHeaderCellControlsProps<TData> =
  TableHeaderActionsMenuProps<TData> & {
    readonly isResizable: boolean;
  };

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> & {
  readonly columnKey: DataKey<TData>;
  readonly customStylex?: StyleXStyles;
  readonly hasSettings?: boolean;
  readonly isLoadingState?: boolean;
};
