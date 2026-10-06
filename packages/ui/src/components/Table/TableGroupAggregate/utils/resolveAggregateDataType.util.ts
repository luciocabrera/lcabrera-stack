import type {
  TableAggregateFn,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';

type ResolveAggregateDataTypeArgs = {
  readonly columnDataType: TableColumnDataType | undefined;
  readonly fn: TableAggregateFn;
};

export const resolveAggregateDataType = ({
  columnDataType = 'string',
  fn,
}: ResolveAggregateDataTypeArgs): TableColumnDataType => {
  if (fn === 'count' || fn === 'countDistinct') {
    return 'number';
  }

  return fn === 'boolAnd' || fn === 'boolOr' ? 'boolean' : columnDataType;
};
