import type { ReactNode } from 'react';

import type { TableCrudConfig } from '#ui/components/Table/Table.types';

export type TableActionMenuProps = {
  readonly crud: TableCrudConfig;
  readonly customActions?: ReactNode;
  readonly onDelete: () => void;
  readonly resolvedTitleSingular: string;
  readonly rowId: string;
};
