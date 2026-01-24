import * as stylex from '@stylexjs/stylex';
import { useMemo } from 'react';

import type { ColumnFilter, OperatorType } from '@/types/filterOperators.types';

import type { FilterInputsProps } from './FilterInputs.types';

import { BooleanFilterInput } from '../BooleanFilterInput';
import { styles } from './FilterInputs.stylex';
import { InputContent } from './InputContent';
import { getOperatorFromFilter, getOperatorOptions } from './utils';

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
  // Derive operator directly from filter prop - always in sync with parent state
  const operator = useMemo<OperatorType>(
    () => getOperatorFromFilter({ dataType: column.dataType, filter }),
    [column.dataType, filter],
  );

  // Handle operator change - updates parent filter state directly
  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as OperatorType;

    if (!filter || filter.type === 'boolean') return;

    // Update filter with new operator - the select dropdown only shows valid operators for the column type
    onChange({ ...filter, operator: newOperator } as ColumnFilter);
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

  const operatorOptions = getOperatorOptions({ dataType: column.dataType });

  return (
    <div {...stylex.props(styles.container)}>
      <select
        onChange={handleOperatorChange}
        value={operator}
        {...stylex.props(styles.select)}
      >
        {operatorOptions.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <InputContent
        column={column}
        filter={filter}
        filterOptions={filterOptions}
        hasMore={hasMore}
        isLoadingOptions={isLoadingOptions}
        onChange={onChange}
        onLoadMoreOptions={onLoadMoreOptions}
        operator={operator}
      />
    </div>
  );
};

FilterInputs.displayName = 'FilterInputs';
