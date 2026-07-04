import type {
  DateOperatorType,
  NumberOperatorType,
  SelectFilter,
  TextFilter,
  TextOperatorType,
} from '@repo/ui/types/filterOperators.types';

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
  shouldFillHeight = false,
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
      const textOp = operator as TextOperatorType;
      const shouldShowSelectList =
        hasFetchableOptions && (textOp === 'equals' || textOp === 'notEquals');

      const handleSelectChange = (selectFilter?: SelectFilter) => {
        if (selectFilter) {
          onChange({
            ...selectFilter,
            operator: textOp === 'notEquals' ? 'notEquals' : 'equals',
          });
        } else {
          onChange();
        }
      };

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
            onChange={handleSelectChange}
            shouldFillHeight={shouldFillHeight}
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
