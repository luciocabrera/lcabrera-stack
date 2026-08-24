import type {
  TableAggregateFn,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';

type ResolveAggregateDataTypeArgs = {
  readonly columnDataType: TableColumnDataType | undefined;
  readonly fn: TableAggregateFn;
};

/**
 * The two families that do not are the reason this exists rather than the call site
 * reading `dataType` directly: - **A tally is never money.** `count` over a currency
 * column answers "how many rows", not "how many dollars", and formatting it as currency
 * would put a symbol and two decimals on an integer that has neither.
 * - **A predicate is never a number.** `boolAnd`/`boolOr` answer yes or no whatever they
 * are applied to.
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
