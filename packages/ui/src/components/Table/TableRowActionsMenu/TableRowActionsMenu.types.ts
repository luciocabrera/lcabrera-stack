import type { TableCrudConfig } from '@repo/ui/components/Table/Table.types';
import type { ReactNode } from 'react';

export type TableRowActionsMenuProps<TData extends Record<string, unknown>> = {
  readonly crud: TableCrudConfig<TData>;
  readonly customActions?: ReactNode;
  readonly row: TData;
  readonly titleSingular?: string;
};
