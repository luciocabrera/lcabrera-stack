import * as stylex from '@stylexjs/stylex';

import { FilterInputs } from '@/components/Table/TableHeaderCell/filters/FilterInputs';

import type { FilterEditorProps } from './FilterEditor.types';

import { styles } from './FilterEditor.stylex';

export const FilterEditor = ({
  column,
  filter,
  filterOptions,
  hasMore = false,
  isLoadingOptions = false,
  onChange,
  onLoadMoreOptions,
}: FilterEditorProps) => {
  return (
    <div {...stylex.props(styles.container)} data-testid='filter-editor'>
      <FilterInputs
        column={column}
        filter={filter ?? undefined}
        filterOptions={filterOptions}
        hasMore={hasMore}
        isLoadingOptions={isLoadingOptions}
        onChange={onChange}
        onLoadMoreOptions={onLoadMoreOptions}
      />
    </div>
  );
};

FilterEditor.displayName = 'FilterEditor';
