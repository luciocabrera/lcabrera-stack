import * as stylex from '@stylexjs/stylex';

import type { ColumnFilter, TableColumn } from '@/components/Table/Table.types';

import { FilterInputs } from '../../filters/FilterInputs';
import { styles } from '../FilterPopover.stylex';

type RenderFilterInputArgs = {
  column: TableColumn;
  currentTextOperator:
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith';
  effectiveFilterOptions?: string[] | undefined;
  filter?: ColumnFilter | undefined;
  handleLoadMoreOptions: () => void;
  hasMoreOptions: boolean;
  isFetchingOptions: boolean;
  setCurrentTextOperator: (
    operator:
      | 'contains'
      | 'endsWith'
      | 'equals'
      | 'notContains'
      | 'notEquals'
      | 'startsWith',
  ) => void;
  setLocalFilter: (filter: ColumnFilter | undefined) => void;
};

export const renderFilterInput = ({
  column,
  currentTextOperator,
  effectiveFilterOptions,
  filter,
  handleLoadMoreOptions,
  hasMoreOptions,
  isFetchingOptions,
  setCurrentTextOperator,
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
      currentTextOperator={currentTextOperator}
      filter={filter}
      filterOptions={effectiveFilterOptions}
      hasMore={hasMoreOptions}
      isLoadingOptions={isFetchingOptions}
      onChange={setLocalFilter}
      onLoadMoreOptions={handleLoadMoreOptions}
      onTextOperatorChange={setCurrentTextOperator}
    />
  );
};
