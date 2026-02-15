import * as stylex from '@stylexjs/stylex';
import { useMemo } from 'react';

import type {
  ColumnFilter,
  DateOperatorType,
  NumberOperatorType,
  OperatorType,
  TextOperatorType,
} from '@/types/filterOperators.types';

import type { FilterInputsProps } from './FilterInputs.types';
import { useGetFilterData } from '@/components/Table/TableContext/hooks/store/filters/selectors';
import { BooleanFilterInput } from '../BooleanFilterInput';
import { styles } from './FilterInputs.stylex';
import { InputContent } from './InputContent';
import { getOperatorFromFilter, getOperatorOptions } from './utils';
import { useGetNormalizedColumn } from '@/components/Table/TableContext/hooks/store/columns/selectors/useGetNormalizedColumn.hook';

/**
 * Shared component for rendering filter inputs based on column data type.
 * The operator dropdown is rendered here based on data type.
 * Used by both FilterPopover (column header) and FilterEditor (table settings).
 *
 * Now uses context for filter data - no more prop drilling!
 */
export const FilterInputs = <TData,>({
  columnKey,
  filter,
  onChange,
}: FilterInputsProps<TData>) => {
  // === SELECTORS (subscribe to state) ===
  const column = useGetNormalizedColumn<TData>(columnKey);
  const filterData = useGetFilterData<TData>(columnKey);

  // Determine effective filter options
  const effectiveFilterOptions = useMemo(() => {
    // Use context data if available (fetched async)
    if (filterData?.data && filterData.data.length > 0) {
      return filterData.data;
    }
    // Fallback to static options from column config
    return column.filterOptions ?? [];
  }, [filterData?.data, column.filterOptions]);

  // Derive operator directly from filter prop - always in sync with parent state
  const operator = useMemo<OperatorType>(
    () => getOperatorFromFilter({ dataType: column.dataType, filter }),
    [column.dataType, filter],
  );

  // TODO: I think we should to use the data type
  // Handle operator change - updates parent filter state directly
  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as OperatorType;

    // Boolean filters don't have operators
    if (filter?.type === 'boolean') return;

    // If filter exists, update it with new operator
    if (filter) {
      onChange({ ...filter, operator: newOperator } as ColumnFilter);
      return;
    }

    // No filter yet - create initial filter based on column data type
    if (column.dataType === 'number') {
      onChange({
        operator: newOperator as NumberOperatorType,
        type: 'number',
        value: undefined as unknown as number,
      });
    } else if (column.dataType === 'date') {
      onChange({
        operator: newOperator as DateOperatorType,
        type: 'date',
        value: '',
      });
    } else {
      // String type (text filter)
      onChange({
        operator: newOperator as TextOperatorType,
        type: 'text',
        value: '',
      });
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
        dataType={column.dataType}
        columnKey={columnKey}
        filter={filter}
        filterOptions={effectiveFilterOptions}
        onChange={onChange}
        operator={operator}
      />
    </div>
  );
};

FilterInputs.displayName = 'FilterInputs';
