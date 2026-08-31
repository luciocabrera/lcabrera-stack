import type {
  TableAggregateFn,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';

type ResolveAggregateDataTypeArgs = {
  readonly columnDataType: TableColumnDataType | undefined;
  readonly fn: TableAggregateFn;
};

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
