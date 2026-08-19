import type { TableGroupAggregateValue } from '#ui/components/Table/Table.types';

export type TableGroupShareValueProps = {
  readonly columnKey: string;
  /** The aggregate's raw value, exactly as the read produced it. */
  readonly value: TableGroupAggregateValue['value'];
};
