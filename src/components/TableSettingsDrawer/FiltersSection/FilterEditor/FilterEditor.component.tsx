import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

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
  // Track text operator state for string columns with options
  const [textOperator, setTextOperator] = useState<
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith'
  >('equals');

  // Sync textOperator with the filter's operator
  useEffect(() => {
    console.log('🔧 [FilterEditor] useEffect - filter:', filter, 'textOperator:', textOperator);
    if (filter?.type === 'text' && filter.operator) {
      console.log('🔧 [FilterEditor] Setting textOperator to:', filter.operator);
      setTextOperator(filter.operator);
    }
  }, [filter]);

  console.log('🔧 [FilterEditor] Render - column:', column.key, 'dataType:', column.dataType, 'filterOptions:', filterOptions, 'filter:', filter, 'textOperator:', textOperator);

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
          
          console.log('🔧 [FilterEditor] String with options - textOperator:', textOperator, 'isSelectListVisible:', isSelectListVisible, 'filterOptions.length:', filterOptions.length);

          return (
            <div {...stylex.props(styles.stringFilterContainer)}>
              <TextFilterInput
                filter={filter?.type === 'text' ? filter : undefined}
                onChange={onChange}
                onOperatorChange={setTextOperator}
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
        console.log('🔧 [FilterEditor] String without options');
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
