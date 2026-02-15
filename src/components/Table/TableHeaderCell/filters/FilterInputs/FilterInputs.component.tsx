import * as stylex from '@stylexjs/stylex';
import { useCallback, useMemo } from 'react';

import type {
  ColumnFilter,
  DateOperatorType,
  NumberOperatorType,
  OperatorType,
  TextOperatorType,
} from '@/types/filterOperators.types';

import type { FilterInputsProps } from './FilterInputs.types';

import { useFetchMoreFilterData } from '@/components/Table/TableContext/hooks/store/filters/actions';
import { useGetFilterData } from '@/components/Table/TableContext/hooks/store/filters/selectors';
import { BooleanFilterInput } from '../BooleanFilterInput';
import { styles } from './FilterInputs.stylex';
import { InputContent } from './InputContent';
import { getOperatorFromFilter, getOperatorOptions } from './utils';

/**
 * Shared component for rendering filter inputs based on column data type.
 * The operator dropdown is rendered here based on data type.
 * Used by both FilterPopover (column header) and FilterEditor (table settings).
 * 
 * Now uses context for filter data - no more prop drilling!
 */
export const FilterInputs = <TData,>({
  columnKey,
  column,
  filter,
  onChange,
}: FilterInputsProps<TData>) => {
  // === SELECTORS (subscribe to state) ===
  const filterData = useGetFilterData<TData>(columnKey);

  // === ACTIONS (get mutation functions) ===
  const fetchMoreFilterData = useFetchMoreFilterData<string, unknown>(String(columnKey));

  // Determine effective filter options
  const effectiveFilterOptions = useMemo(() => {
    // Use context data if available (fetched async)
    if (filterData?.data && filterData.data.length > 0) {
      return filterData.data;
    }
    // Fallback to static options from column config
    return column.filterOptions ?? [];
  }, [filterData?.data, column.filterOptions]);

  const hasMore = filterData?.hasMore ?? false;
  const isLoadingOptions = filterData?.isLoading || filterData?.isLoadingMore || false;

  // Handle loading more options
  const handleLoadMoreOptions = useCallback(() => {
    if (!column.fetchFilterOptions || !hasMore || isLoadingOptions) {
      return;
    }

    void fetchMoreFilterData({
      dataSelector: column.filterOptionsDataSelector,
      dataTotalSelector: column.filterOptionsDataTotalSelector,
      onLoadMore: column.fetchFilterOptions,
    });
  }, [
    column.fetchFilterOptions,
    column.filterOptionsDataSelector,
    column.filterOptionsDataTotalSelector,
    fetchMoreFilterData,
    hasMore,
    isLoadingOptions,
  ]);

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
        hasMore={hasMore}
        isLoadingOptions={isLoadingOptions}
        onChange={onChange}
        onLoadMoreOptions={handleLoadMoreOptions}
        operator={operator}
      />
    </div>
  );
};

FilterInputs.displayName = 'FilterInputs';
