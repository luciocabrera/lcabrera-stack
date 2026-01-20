import type { SelectFilter } from '../../../Table.types';

export type SelectFilterInputProps = {
  filter: SelectFilter | undefined;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onChange: (filter: SelectFilter | undefined) => void;
  onLoadMore?: () => void;
  options: string[];
};
