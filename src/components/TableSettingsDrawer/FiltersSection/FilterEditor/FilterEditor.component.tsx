import * as stylex from '@stylexjs/stylex';
import { useMemo } from 'react';

import { BooleanFilterInput } from '@/components/Table/TableHeaderCell/filters/BooleanFilterInput';
import { DateFilterInput } from '@/components/Table/TableHeaderCell/filters/DateFilterInput';
import { NumberFilterInput } from '@/components/Table/TableHeaderCell/filters/NumberFilterInput';
import { SelectFilterInput } from '@/components/Table/TableHeaderCell/filters/SelectFilterInput';
import { TextFilterInput } from '@/components/Table/TableHeaderCell/filters/TextFilterInput';

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
  // Derive text operator from filter (no need for local state)
  const textOperator = useMemo(
    () => (filter?.type === 'text' ? filter.operator : 'equals'),
    [filter],
  );

  const renderFilterInput = () => {
    switch (column.dataType) {
      case 'boolean': {
        return (
          <BooleanFilterInput
            filter={filter?.type === 'boolean' ? filter : undefined}
            onChange={onChange}
          />
        );
      }
      case 'currency':
      case 'number': {
        return (
          <NumberFilterInput
            filter={filter?.type === 'number' ? filter : undefined}
            onChange={onChange}
          />
        );
      }
      case 'date': {
        return (
          <DateFilterInput
            filter={filter?.type === 'date' ? filter : undefined}
            onChange={onChange}
          />
        );
      }
      default: {
        // If there are filter options, show both TextFilterInput and SelectFilterInput
        if (filterOptions && filterOptions.length > 0) {
          const isSelectListVisible =
            textOperator === 'equals' || textOperator === 'notEquals';

          return (
            <div {...stylex.props(styles.stringFilterContainer)}>
              <TextFilterInput
                filter={filter?.type === 'text' ? filter : undefined}
                onChange={onChange}
                onOperatorChange={(operator) => {
                  // Update filter with new operator by creating a new text filter or updating existing
                  const currentFilter = filter?.type === 'text' ? filter : undefined;
                  onChange({
                    ...currentFilter,
                    operator,
                    type: 'text',
                    value: currentFilter?.value ?? '',
                  });
                }}
              />
              {isSelectListVisible && (
                <SelectFilterInput
                  filter={
                    filter?.type === 'select' || filter?.type === 'multiSelect'
                      ? filter
                      : undefined
                  }
                  hasMore={hasMore}
                  isLoadingMore={isLoadingOptions}
                  onChange={onChange}
                  onLoadMore={onLoadMoreOptions}
                  options={filterOptions}
                />
              )}
            </div>
          );
        }
        // Otherwise use TextFilterInput only
        return (
          <TextFilterInput
            filter={filter?.type === 'text' ? filter : undefined}
            onChange={onChange}
          />
        );
      }
    }
  };

  return (
    <div {...stylex.props(styles.container)} data-testid='filter-editor'>
      {renderFilterInput()}
    </div>
  );
};

FilterEditor.displayName = 'FilterEditor';
