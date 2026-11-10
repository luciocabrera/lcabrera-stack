import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { useGetDeclaredColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetDeclaredColumn.hook';

import type { FilterInputsProps } from './FilterInputs.types';

import { BooleanFilterInput } from '../BooleanFilterInput';
import { styles } from './FilterInputs.stylex';
import { FilterValueSlot } from './FilterValueSlot/FilterValueSlot.component';
import { InputContent } from './InputContent';
import { OperatorSelect } from './OperatorSelect/OperatorSelect.component';
import {
  getOperatorFromFilter,
  resolveOperatorJoin,
  toBooleanColumnFilter,
} from './utils';

export const FilterInputs = <TData = Record<string, unknown>,>({
  columnKey,
  filter,
  listMaxHeight,
  onChange,
  shouldFillHeight = false,
}: FilterInputsProps<TData>) => {
  const column = useGetDeclaredColumn<TData>(columnKey);
  const dataType = column?.dataType;

  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  if (dataType === 'boolean') {
    return (
      <BooleanFilterInput
        filter={toBooleanColumnFilter(filter)}
        onChange={onChange}
      />
    );
  }

  if (filter?.type === 'empty') {
    return (
      <div {...stylex.props(styles.container)}>
        <OperatorSelect
          dataType={dataType}
          filter={filter}
          onChange={onChange}
          onOpenChange={setIsOperatorOpen}
        />
      </div>
    );
  }

  const operator = getOperatorFromFilter({ dataType, filter });
  const hasFetchableOptions = Boolean(column?.filterOptionsDescriptor);
  const { attachedEdge, containerStyle } = resolveOperatorJoin({
    dataType,
    filter,
    hasFetchableOptions,
    operator,
  });

  const inputComponent = (
    <InputContent
      columnKey={columnKey}
      dataType={dataType}
      filter={filter}
      hasFetchableOptions={hasFetchableOptions}
      listMaxHeight={listMaxHeight}
      onChange={onChange}
      operator={operator}
      shouldFillHeight={shouldFillHeight}
    />
  );

  return (
    <div
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
        containerStyle,
      )}
    >
      <OperatorSelect
        attachedEdge={attachedEdge}
        dataType={dataType}
        filter={filter}
        onChange={onChange}
        onOpenChange={setIsOperatorOpen}
      />
      <FilterValueSlot
        hasFilter={filter !== undefined}
        isOperatorOpen={isOperatorOpen}
        shouldFillHeight={shouldFillHeight}
      >
        {inputComponent}
      </FilterValueSlot>
    </div>
  );
};
