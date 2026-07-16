import type {
  DateOperatorType,
  NumberOperatorType,
  TextOperatorType,
} from '@repo/ui/types/filterOperators.types';

import type { InputContentProps } from './InputContent.types';

import { DateFilterInput } from '../../DateFilterInput';
import { NumberFilterInput } from '../../NumberFilterInput';
import { TextOrSelectFilterInput } from './TextOrSelectFilterInput/TextOrSelectFilterInput.component';

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
      return (
        <TextOrSelectFilterInput
          columnKey={columnKey}
          filter={filter}
          hasFetchableOptions={hasFetchableOptions}
          listMaxHeight={listMaxHeight}
          onChange={onChange}
          operator={operator as TextOperatorType}
          shouldFillHeight={shouldFillHeight}
        />
      );
    }
  }
};
