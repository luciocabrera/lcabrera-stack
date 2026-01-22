import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type {
  DateOperatorType,
  NumberOperatorType,
  OperatorOption,
  OperatorType,
  TextOperatorType,
} from '@/components/Table/constants';
import type { TextFilter } from '@/components/Table/Table.types';

import {
  DATE_OPERATORS,
  NUMBER_OPERATORS,
  TEXT_OPERATORS,
} from '@/components/Table/constants';

import type { FilterInputsProps } from './FilterInputs.types';

import { BooleanFilterInput } from '../BooleanFilterInput';
import { DateFilterInput } from '../DateFilterInput';
import { NumberFilterInput } from '../NumberFilterInput';
import { SelectFilterInput } from '../SelectFilterInput';
import { TextFilterInput } from '../TextFilterInput';
import { styles } from './FilterInputs.stylex';

/**
 * Shared component for rendering filter inputs based on column data type.
 * The operator dropdown is rendered here based on data type.
 * Used by both FilterPopover (column header) and FilterEditor (table settings).
 */
export const FilterInputs = ({
  column,
  filter,
  filterOptions,
  hasMore = false,
  isLoadingOptions = false,
  onChange,
  onLoadMoreOptions,
}: FilterInputsProps) => {
  // Get operator from filter or default to 'equals'
  const getOperatorFromFilter = (): OperatorType => {
    if (!filter) return 'equals';
    if (column.dataType === 'boolean') return 'equals';
    if ('operator' in filter && filter.operator) {
      return filter.operator;
    }
    return 'equals';
  };

  // Track the operator for non-boolean data types
  const [operator, setOperator] = useState<OperatorType>(getOperatorFromFilter);

  // Handle operator change
  const handleOperatorChange = (newOperator: OperatorType) => {
    setOperator(newOperator);

    // Update existing filter with new operator if we have values
    if (!filter) {
      return;
    }

    switch (column.dataType) {
      case 'currency':
      case 'number': {
        if (filter.value) {
          onChange({ ...filter, operator: newOperator as NumberOperatorType });
        }
        break;
      }
      case 'date': {
        if (filter.value) {
          onChange({ ...filter, operator: newOperator as DateOperatorType });
        }
        break;
      }
      default: {
        if (
          (filter.type === 'select' || filter.type === 'multiSelect') &&
          filter.values?.length
        ) {
          onChange({
            ...filter,
            operator: newOperator as 'equals' | 'notEquals',
          });
        } else if (filter.value) {
          // String/text columns - can be text, select, or multiSelect filter types
          onChange({ ...filter, operator: newOperator as TextOperatorType });
        }
        break;
      }
    }
  };

  // Render based on data type
  // Boolean has no operator dropdown - render directly
  if (column.dataType === 'boolean') {
    return (
      <BooleanFilterInput
        filter={filter?.type === 'boolean' ? filter : undefined}
        onChange={onChange}
      />
    );
  }

  // Determine operator options and input content based on data type
  let operatorOptions: OperatorOption<OperatorType>[];
  let inputContent: React.ReactNode;

  switch (column.dataType) {
    case 'currency':
    case 'number': {
      operatorOptions = NUMBER_OPERATORS as OperatorOption<OperatorType>[];
      inputContent = (
        <NumberFilterInput
          filter={filter}
          onChange={onChange}
          operator={operator as NumberOperatorType}
        />
      );
      break;
    }

    case 'date': {
      operatorOptions = DATE_OPERATORS as OperatorOption<OperatorType>[];
      inputContent = (
        <DateFilterInput
          filter={filter}
          onChange={onChange}
          operator={operator as DateOperatorType}
        />
      );
      break;
    }

    default: {
      // String columns
      const hasOptions = filterOptions && filterOptions.length > 0;
      const textOp = operator as TextOperatorType;

      // Show SelectFilterInput when options are available AND operator is equals/notEquals
      const shouldShowSelectList =
        hasOptions && (textOp === 'equals' || textOp === 'notEquals');

      operatorOptions = TEXT_OPERATORS as OperatorOption<OperatorType>[];
      inputContent = shouldShowSelectList ? (
        <SelectFilterInput
          filter={
            filter?.type === 'select' || filter?.type === 'multiSelect'
              ? filter
              : undefined
          }
          hasMore={hasMore}
          isLoadingMore={isLoadingOptions}
          onChange={(selectFilter) => {
            if (selectFilter) {
              onChange({
                ...selectFilter,
                operator: textOp === 'notEquals' ? 'notEquals' : 'equals',
              });
            } else {
              onChange();
            }
          }}
          onLoadMore={onLoadMoreOptions}
          options={filterOptions}
        />
      ) : (
        <TextFilterInput
          filter={filter as TextFilter}
          onChange={onChange}
          operator={textOp}
        />
      );
      break;
    }
  }

  return (
    <div {...stylex.props(styles.container)}>
      <select
        onChange={(e) => {
          handleOperatorChange(e.target.value as OperatorType);
        }}
        value={operator}
        {...stylex.props(styles.select)}
      >
        {operatorOptions.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      {inputContent}
    </div>
  );
};

FilterInputs.displayName = 'FilterInputs';
