import { useGetNormalizedColumn } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetNormalizedColumn.hook';
import * as stylex from '@stylexjs/stylex';
import { Activity, useState } from 'react';

import type { FilterInputsProps } from './FilterInputs.types';

import { BooleanFilterInput } from '../BooleanFilterInput';
import { styles } from './FilterInputs.stylex';
import { InputContent } from './InputContent';
import { OperatorSelect } from './OperatorSelect/OperatorSelect.component';
import { getOperatorFromFilter } from './utils';

/**
 * Shared component for rendering filter inputs based on column data type; a
 * thin shell composing the OperatorSelect delegate and the type-dispatched
 * InputContent, plus the input-visibility orchestration while the operator
 * dropdown is open. Used by both drawers, each wiring its own filter store
 * through the filter/onChange props.
 */
export const FilterInputs = <TData = Record<string, unknown>,>({
  columnKey,
  filter,
  listMaxHeight,
  onChange,
  shouldFillHeight = false,
}: FilterInputsProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);

  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  if (column.dataType === 'boolean') {
    return (
      <BooleanFilterInput
        filter={filter?.type === 'boolean' ? filter : undefined}
        onChange={onChange}
      />
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
        shouldFillHeight={shouldFillHeight}
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
