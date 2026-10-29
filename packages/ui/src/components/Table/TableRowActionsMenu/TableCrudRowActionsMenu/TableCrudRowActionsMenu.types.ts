import type { ReactNode } from 'react';

import type { TableCrudConfig } from '#ui/components/Table/Table.types';

export type TableCrudRowActionsMenuProps = {
  readonly crud: TableCrudConfig;
  readonly customActions?: ReactNode;
  readonly isLoadingState: boolean;
  readonly rowId: string;
};
