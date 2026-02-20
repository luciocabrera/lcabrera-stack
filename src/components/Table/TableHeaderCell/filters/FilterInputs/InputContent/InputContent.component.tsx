import type {
  DateOperatorType,
  NumberOperatorType,
  TextFilter,
  TextOperatorType,
} from '@/types/filterOperators.types';

import type { InputContentProps } from './InputContent.types';

import { DateFilterInput } from '../../DateFilterInput';
import { NumberFilterInput } from '../../NumberFilterInput';
import { SelectFilterInput } from '../../SelectFilterInput';
import { TextFilterInput } from '../../TextFilterInput';

/**
 * Renders the appropriate filter input based on column data type.
 */
export const InputContent = <TData,>({
  columnKey,
  dataType,
  filter,
  hasFetchableOptions,
  listMaxHeight,
  onChange,
  operator,
}: InputContentProps<TData>) => {
  switch (dataType) {
    case 'currency':
    case 'number': {
      return (
        <NumberFilterInput
          columnKey={columnKey}
          filter={filter?.type === 'number' ? filter : undefined}
          onChange={onChange}
          operator={operator as NumberOperatorType}
        />
      );
    }

    case 'date': {
      return (
        <DateFilterInput
          columnKey={columnKey}
          filter={filter?.type === 'date' ? filter : undefined}
          onChange={onChange}
          operator={operator as DateOperatorType}
        />
      );
    }
    default: {
      // String columns
      const textOp = operator as TextOperatorType;

      // Show SelectFilterInput when column supports options AND operator is equals/notEquals
      const shouldShowSelectList =
        hasFetchableOptions && (textOp === 'equals' || textOp === 'notEquals');

      if (shouldShowSelectList) {
        return (
          <SelectFilterInput
            columnKey={columnKey}
            filter={
              filter?.type === 'select' || filter?.type === 'multiSelect'
                ? filter
                : undefined
            }
            listMaxHeight={listMaxHeight}
            onChange={(selectFilter) => {
              if (selectFilter) {
                onChange({
                  ...selectFilter,
                  operator: textOp === 'notEquals' ? 'notEquals' : 'equals',
                });
              }
            }}
          />
        );
      }

      return (
        <TextFilterInput
          columnKey={columnKey}
          filter={filter as TextFilter}
          onChange={onChange}
          operator={textOp}
        />
      );
    }
  }
};

InputContent.displayName = 'InputContent';
