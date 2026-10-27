import type { ReactNode } from 'react';

import type { TableCrudConfig } from '#ui/components/Table/Table.types';

export type TableCrudRowActionsMenuProps = {
  readonly crud: TableCrudConfig;
  readonly customActions?: ReactNode;
  readonly isLoadingState: boolean;
  readonly rowId: string;
};

export type TableRowActionsMenuProps<TData extends Record<string, unknown>> = {
  readonly customActions?: ReactNode;
  readonly isLoadingState?: boolean;
  readonly row: TData;
};
