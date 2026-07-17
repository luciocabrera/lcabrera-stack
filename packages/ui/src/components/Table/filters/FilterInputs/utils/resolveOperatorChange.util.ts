import type { TableColumnDataType } from '@repo/ui/components/Table/Table.types';
import type {
  ColumnFilter,
  DateOperatorType,
  NumberOperatorType,
  TextOperatorType,
  OperatorType,
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
 *
 * The filter's `type` follows the column's data type — and, for a select-backed
 * string column, the operator. A select filter only models `equals`/`notEquals`
 * (`SelectFilter['operator']`), and `TextOrSelectFilterInput` swaps to a text
 * input for every other operator, so the filter has to convert with it. Keeping
 * `type: 'select'` while the operator moved on left the stale selected values
 * serializing as `equals` behind a text input the user was typing into.
 *
 * Filters are rebuilt per data type rather than spread-and-overridden, so a
 * mismatched pair (`{ type: 'select', operator: 'contains' }`) cannot be
 * constructed — the old `as ColumnFilter` on the spread is what let it through.
 */
// Return annotation required: the branch literals ('number'/'date'/'text')
// widen to string without the ColumnFilter contextual type.
export const resolveOperatorChange = ({
  dataType,
  filter,
  operator,
}: ResolveOperatorChangeArgs): ColumnFilter => {
  if (dataType === 'currency' || dataType === 'number') {
    const previous = filter?.type === 'number' ? filter : undefined;

    return {
      ...previous,
      operator: operator as NumberOperatorType,
      type: 'number',
      value: previous?.value,
    };
  }

  if (dataType === 'date') {
    const previous = filter?.type === 'date' ? filter : undefined;

    return {
      ...previous,
      operator: operator as DateOperatorType,
      type: 'date',
      value: previous?.value ?? '',
    };
  }

  if (filter?.type === 'multiSelect' || filter?.type === 'select') {
    // The only operators a select filter can model, so the select input stays.
    if (operator === 'equals' || operator === 'notEquals') {
      return { ...filter, operator };
    }

    // Carry the chosen option across so "equals alpha" becomes "contains alpha"
    // rather than silently emptying the filter the user just built.
    return {
      operator: operator as TextOperatorType,
      type: 'text',
      value: filter.value ?? filter.values?.[0] ?? '',
    };
  }

  return {
    operator: operator as TextOperatorType,
    type: 'text',
    value: filter?.type === 'text' ? filter.value : '',
  };
};
