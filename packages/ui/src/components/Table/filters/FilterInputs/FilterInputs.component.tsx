import * as stylex from '@stylexjs/stylex';
import { Activity, useState } from 'react';

import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetNormalizedColumn.hook';

import type { FilterInputsProps } from './FilterInputs.types';

import { BooleanFilterInput } from '../BooleanFilterInput';
import { styles } from './FilterInputs.stylex';
import { InputContent } from './InputContent';
import { OperatorSelect } from './OperatorSelect/OperatorSelect.component';
import { getOperatorFromFilter } from './utils';

export const FilterInputs = <TData = Record<string, unknown>,>({
  columnKey,
  filter,
  listMaxHeight,
  onChange,
  shouldFillHeight = false,
}: FilterInputsProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);

  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  // A boolean column gets no operator dropdown at all, so `BooleanFilterInput`
  // carries the empty operators itself and this branch must **forward** an
  // empty filter rather than drop it. Dropping it left the control reading
  // "All" while the table was filtered to the null rows, with no way to clear
  // it — the empty branch below never runs for a boolean column.
  if (column.dataType === 'boolean') {
    return (
      <BooleanFilterInput
        filter={
          filter?.type === 'boolean' || filter?.type === 'empty'
            ? filter
            : undefined
        }
        onChange={onChange}
      />
    );
  }

  // A filter that takes no value has nothing to render an input for, and an
  // empty one would invite a value the operator cannot carry.
  if (filter?.type === 'empty') {
    return (
      <div {...stylex.props(styles.container)}>
        <OperatorSelect
          dataType={column.dataType}
          filter={filter}
          onChange={onChange}
          onOpenChange={setIsOperatorOpen}
        />
      </div>
    );
  }

  const inputComponent = (
    <InputContent
      columnKey={columnKey}
      dataType={column.dataType}
      filter={filter}
      hasFetchableOptions={Boolean(column.filterOptionsDescriptor)}
      listMaxHeight={listMaxHeight}
      onChange={onChange}
      operator={getOperatorFromFilter({ dataType: column.dataType, filter })}
      shouldFillHeight={shouldFillHeight}
    />
  );

  return (
    <div
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <OperatorSelect
        dataType={column.dataType}
        filter={filter}
        onChange={onChange}
        onOpenChange={setIsOperatorOpen}
      />
      {shouldFillHeight ? (
        <Activity mode={isOperatorOpen || !filter ? 'hidden' : 'visible'}>
          {inputComponent}
        </Activity>
      ) : (
        filter && (
          <div {...stylex.props(isOperatorOpen && styles.contentHidden)}>
            {inputComponent}
          </div>
        )
      )}
    </div>
  );
};
