import type { ReactNode } from 'react';

export type TableRowActionsMenuProps<TData extends Record<string, unknown>> = {
  readonly customActions?: ReactNode;
  readonly isLoadingState?: boolean;
  readonly row: TData;
};
