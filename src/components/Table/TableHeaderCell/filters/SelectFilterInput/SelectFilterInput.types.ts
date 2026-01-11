import type { SelectFilter } from '@/components/Table';

export type SelectFilterInputProps = {
  filter: null | SelectFilter | undefined;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onChange: (filter: null | SelectFilter | undefined) => void;
  onLoadMore?: () => void;
  options: string[];
};
