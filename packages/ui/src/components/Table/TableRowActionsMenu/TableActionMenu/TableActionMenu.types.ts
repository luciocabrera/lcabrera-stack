import type {
  TableCrudConfig,
  TableCrudId,
} from '@repo/ui/components/Table/Table.types';
import type { ReactNode } from 'react';

export type TableActionMenuProps<TData extends Record<string, unknown>> = {
  readonly crud: TableCrudConfig<TData>;
  readonly customActions?: ReactNode;
  readonly onDelete: () => void;
  readonly resolvedTitleSingular: string;
  readonly rowId: TableCrudId;
};
