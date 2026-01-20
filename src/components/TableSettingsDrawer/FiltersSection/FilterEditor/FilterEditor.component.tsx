import * as stylex from '@stylexjs/stylex';

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
  isLoadingOptions = false,
  onChange,
  onLoadMoreOptions,
}: FilterEditorProps) => {
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
        // If there are filter options, use SelectFilterInput
        if (filterOptions && filterOptions.length > 0) {
          return (
            <SelectFilterInput
              filter={
                filter?.type === 'select' || filter?.type === 'multiSelect'
                  ? filter
                  : undefined
              }
              hasMore={false}
              isLoadingMore={isLoadingOptions}
              onChange={onChange}
              onLoadMore={onLoadMoreOptions}
              options={filterOptions}
            />
          );
        }
        // Otherwise use TextFilterInput
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
