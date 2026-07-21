import type { TableCrudConfig } from '@lcabrera/ui/components/Table/Table.types';
import type { ReactNode } from 'react';

export type TableActionMenuProps = {
  readonly crud: TableCrudConfig;
  readonly customActions?: ReactNode;
  readonly onDelete: () => void;
  readonly resolvedTitleSingular: string;
  readonly rowId: string;
};
