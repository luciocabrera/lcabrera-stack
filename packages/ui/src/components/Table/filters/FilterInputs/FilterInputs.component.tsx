import * as stylex from '@stylexjs/stylex';
import { Activity, useState } from 'react';

import { useGetDeclaredColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetDeclaredColumn.hook';

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
  const column = useGetDeclaredColumn<TData>(columnKey);
  const dataType = column?.dataType;

  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  if (dataType === 'boolean') {
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

  const inputComponent = (
    <InputContent
      columnKey={columnKey}
      dataType={dataType}
      filter={filter}
      hasFetchableOptions={Boolean(column?.filterOptionsDescriptor)}
      listMaxHeight={listMaxHeight}
      onChange={onChange}
      operator={getOperatorFromFilter({ dataType, filter })}
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
        dataType={dataType}
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
