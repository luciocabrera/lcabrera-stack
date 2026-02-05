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
  column,
  filter,
  filterOptions,
  hasMore,
  isLoadingOptions,
  onChange,
  onLoadMoreOptions,
  operator,
}: InputContentProps<TData>) => {
  switch (column.dataType) {
    case 'currency':
    case 'number': {
      return (
        <NumberFilterInput
          filter={filter?.type === 'number' ? filter : undefined}
          onChange={onChange}
          operator={operator as NumberOperatorType}
        />
      );
    }

    case 'date': {
      return (
        <DateFilterInput
          filter={filter?.type === 'date' ? filter : undefined}
          onChange={onChange}
          operator={operator as DateOperatorType}
        />
      );
    }

    default: {
      // String columns
      const hasOptions = filterOptions && filterOptions.length > 0;
      const textOp = operator as TextOperatorType;

      // Show SelectFilterInput when options are available AND operator is equals/notEquals
      const shouldShowSelectList =
        hasOptions && (textOp === 'equals' || textOp === 'notEquals');

      if (shouldShowSelectList) {
        return (
          <SelectFilterInput
            filter={
              filter?.type === 'select' || filter?.type === 'multiSelect'
                ? filter
                : undefined
            }
            hasMore={hasMore}
            isLoadingMore={isLoadingOptions}
            onChange={(selectFilter) => {
              if (selectFilter) {
                onChange({
                  ...selectFilter,
                  operator: textOp === 'notEquals' ? 'notEquals' : 'equals',
                });
              } else {
                onChange();
              }
            }}
            onLoadMore={onLoadMoreOptions}
            options={filterOptions}
          />
        );
      }

      return (
        <TextFilterInput
          filter={filter as TextFilter}
          onChange={onChange}
          operator={textOp}
        />
      );
    }
  }
};

InputContent.displayName = 'InputContent';
