import type {
  TableAggregateFn,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';

type ResolveAggregateDataTypeArgs = {
  readonly columnDataType: TableColumnDataType | undefined;
  readonly fn: TableAggregateFn;
};

/**
 * How an aggregate should be rendered, which is **not** always how its column
 * is.
 *
 * An aggregate inherits its column's type only when it answers in the column's
 * own units. `sum`, `avg`, `min` and `max` over a currency column are still
 * money; over a date column `min`/`max` are still dates. Those pass through.
 *
 * The two families that do not are the reason this exists rather than the call
 * site reading `dataType` directly:
 *
 * - **A tally is never money.** `count` over a currency column answers "how
 *   many rows", not "how many dollars", and formatting it as currency would put
 *   a symbol and two decimals on an integer that has neither.
 * - **A predicate is never a number.** `boolAnd`/`boolOr` answer yes or no
 *   whatever they are applied to.
 *
 * A column with no declared `dataType` falls back to `string`, matching what
 * the cell renderer does with the same absence — the aggregate and the cells
 * beneath it stay in step even when the consumer declared nothing.
 */
export const resolveAggregateDataType = ({
  columnDataType,
  fn,
}: ResolveAggregateDataTypeArgs): TableColumnDataType => {
  if (fn === 'count' || fn === 'countDistinct') {
    return 'number';
  }

  if (fn === 'boolAnd' || fn === 'boolOr') {
    return 'boolean';
  }

  return columnDataType ?? 'string';
};
