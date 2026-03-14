import * as stylex from '@stylexjs/stylex';
import { Activity, useState } from 'react';

import type {
  ColumnFilter,
  DateOperatorType,
  NumberOperatorType,
  TextOperatorType,
} from '@/types/filterOperators.types';

import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetNormalizedColumn.hook';
import { VirtualSelect } from '@/components/VirtualSelect';

import type { FilterInputsProps } from './FilterInputs.types';

import { BooleanFilterInput } from '../BooleanFilterInput';
import { styles } from './FilterInputs.stylex';
import { InputContent } from './InputContent';
import {
  getOperatorFromFilter,
  getOperatorOptions,
  getSelectedOperatorLabel,
} from './utils';

/**
 * Shared component for rendering filter inputs based on column data type.
 * The operator dropdown is rendered here based on data type.
 * Used by both FilterDrawer (column header) and FilterSectionBody (table settings drawer).
 *
 * Now uses context for filter data - no more prop drilling!
 */
export const FilterInputs = <TData,>({
  columnKey,
  filter,
  listMaxHeight,
  onChange,
  shouldFillHeight = false,
}: FilterInputsProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);

  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  const operator = getOperatorFromFilter({ dataType: column.dataType, filter });
  const operatorOptions = getOperatorOptions({ dataType: column.dataType });
  const operatorLabels = operatorOptions.map((op) => op.label);

  const selectedOperatorLabel = getSelectedOperatorLabel({
    filter,
    operator,
    operatorOptions,
  });

  const handleOperatorChange = (selectedLabels: string[]) => {
    const selectedLabel = selectedLabels[0];
    if (!selectedLabel) return;

    const matchingOp = operatorOptions.find((op) => op.label === selectedLabel);
    if (!matchingOp) return;

    const newOperator = matchingOp.value;

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

  return (
    <div
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <VirtualSelect
        customStylex={shouldFillHeight ? styles.operatorOverride : undefined}
        mode='single'
        onChange={handleOperatorChange}
        onOpenChange={setIsOperatorOpen}
        options={operatorLabels}
        placeholder='Select operator...'
        selected={selectedOperatorLabel}
      />
      <Activity mode={isOperatorOpen || !filter ? 'hidden' : 'visible'}>
        <InputContent
          columnKey={columnKey}
          dataType={column.dataType}
          filter={filter}
          hasFetchableOptions={Boolean(column.fetchFilterOptions)}
          listMaxHeight={listMaxHeight}
          onChange={onChange}
          operator={operator}
          shouldFillHeight={shouldFillHeight}
        />
      </Activity>
    </div>
  );
};

FilterInputs.displayName = 'FilterInputs';
