import * as stylex from '@stylexjs/stylex';

import type { TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { FilterInputs } from '../../filters/FilterInputs';
import { styles } from '../FilterPopover.stylex';

type RenderFilterInputArgs = {
  column: TableColumn;
  effectiveFilterOptions?: string[] | undefined;
  filter?: ColumnFilter | undefined;
  handleLoadMoreOptions: () => void;
  hasMoreOptions: boolean;
  isFetchingOptions: boolean;
  setLocalFilter: (filter: ColumnFilter | undefined) => void;
};

export const renderFilterInput = ({
  column,
  effectiveFilterOptions,
  filter,
  handleLoadMoreOptions,
  hasMoreOptions,
  isFetchingOptions,
  setLocalFilter,
}: RenderFilterInputArgs) => {
  if (isFetchingOptions) {
    return (
      <div {...stylex.props(styles.loadingContainer)}>Loading options...</div>
    );
  }

  return (
    <FilterInputs
      column={column}
      filter={filter}
      filterOptions={effectiveFilterOptions}
      hasMore={hasMoreOptions}
      isLoadingOptions={isFetchingOptions}
      onChange={setLocalFilter}
      onLoadMoreOptions={handleLoadMoreOptions}
    />
  );
};
