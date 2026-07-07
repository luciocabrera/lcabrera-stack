import type { ReactNode } from 'react';

export type MenuPosition = {
  readonly left: number;
  readonly top: number;
};

export type TableRowActionsMenuProps<TData extends Record<string, unknown>> = {
  readonly customActions?: ReactNode;
  readonly isLoadingState?: boolean;
  readonly row: TData;
};
