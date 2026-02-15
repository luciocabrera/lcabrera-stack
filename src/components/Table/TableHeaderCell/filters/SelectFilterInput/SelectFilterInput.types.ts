import type { DataKey } from '@/components/Table/Table.types';
import type { SelectFilter } from '@/types/filterOperators.types';

export type SelectFilterInputProps<TData> = {
  columnKey: DataKey<TData>;
  filter: SelectFilter | undefined;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onChange: (filter: SelectFilter | undefined) => void;
  onLoadMore?: () => void;
  options: string[];
};
