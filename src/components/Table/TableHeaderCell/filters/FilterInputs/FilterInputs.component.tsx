import * as stylex from '@stylexjs/stylex';
import { useMemo, useState } from 'react';

import type { FilterInputsProps } from './FilterInputs.types';

import { BooleanFilterInput } from '../BooleanFilterInput';
import { DateFilterInput } from '../DateFilterInput';
import { NumberFilterInput } from '../NumberFilterInput';
import { SelectFilterInput } from '../SelectFilterInput';
import { TextFilterInput } from '../TextFilterInput';
import { styles } from './FilterInputs.stylex';

/**
 * Shared component for rendering filter inputs based on column data type.
 * Used by both FilterPopover (column header) and FilterEditor (table settings).
 */
export const FilterInputs = ({
  column,
  currentTextOperator: parentTextOperator,
  filter,
  filterOptions,
  hasMore = false,
  isLoadingOptions = false,
  onChange,
  onLoadMoreOptions,
  onTextOperatorChange,
}: FilterInputsProps) => {
  // Track the text operator separately to handle changes before filter is created
  const [localTextOperator, setLocalTextOperator] = useState<
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith'
  >(parentTextOperator ?? 'equals');

  // Derive text operator from parent prop, filter, or local state
  const textOperator = useMemo(() => {
    // Parent prop takes precedence
    if (parentTextOperator) return parentTextOperator;
    // Then derive from filter
    if (filter?.type === 'text') return filter.operator;
    // Select filters don't have operators - they implicitly use 'equals'
    if (filter?.type === 'select' || filter?.type === 'multiSelect')
      return 'equals';
    return localTextOperator;
  }, [filter, localTextOperator, parentTextOperator]);

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
        // String columns - always show TextFilterInput
        // Additionally show SelectFilterInput when options are available and operator is equals/notEquals
        const hasOptions = filterOptions && filterOptions.length > 0;
        const isSelectListVisible =
          hasOptions &&
          (textOperator === 'equals' || textOperator === 'notEquals');

        return (
          <div {...stylex.props(styles.stringFilterContainer)}>
            <TextFilterInput
              filter={filter?.type === 'text' ? filter : undefined}
              onChange={onChange}
              onOperatorChange={
                hasOptions
                  ? (operator) => {
                      setLocalTextOperator(operator);
                      onTextOperatorChange?.(operator);
                    }
                  : undefined
              }
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
    }
  };

  return renderFilterInput();
};

FilterInputs.displayName = 'FilterInputs';
