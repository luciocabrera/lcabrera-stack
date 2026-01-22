import type { SelectFilter } from '../../../Table.types';

/** SelectFilterInput is a pure value selector (checkboxes list) */
export type SelectFilterInputProps = {
  filter: SelectFilter | undefined;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onChange: (filter: SelectFilter | undefined) => void;
  onLoadMore?: () => void;
  options: string[];
};
