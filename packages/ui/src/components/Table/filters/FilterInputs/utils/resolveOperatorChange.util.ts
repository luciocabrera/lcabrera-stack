import type { TableColumnDataType } from '@repo/ui/components/Table/Table.types';
import type {
  ColumnFilter,
  DateOperatorType,
  NumberOperatorType,
  OperatorType,
  TextOperatorType,
} from '@repo/ui/types/filterOperators.types';

type ResolveOperatorChangeArgs = {
  readonly dataType?: TableColumnDataType;
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

/**
 * Build the next filter draft for an operator change: keep the existing
 * filter's value and swap its operator, or seed a typed empty filter for the
 * column's data type when no filter exists yet.
 */
// Return annotation required: the branch literals ('number'/'date'/'text')
// widen to string without the ColumnFilter contextual type.
export const resolveOperatorChange = ({
  dataType,
  filter,
  operator,
}: ResolveOperatorChangeArgs): ColumnFilter => {
  if (filter && filter.type !== 'boolean') {
    return { ...filter, operator } as ColumnFilter;
  }

  if (dataType === 'currency' || dataType === 'number') {
    return {
      operator: operator as NumberOperatorType,
      type: 'number',
      value: undefined,
    };
  }

  if (dataType === 'date') {
    return { operator: operator as DateOperatorType, type: 'date', value: '' };
  }

  return { operator: operator as TextOperatorType, type: 'text', value: '' };
};
