import type { TableGroupAggregateValue } from '#ui/components/Table/Table.types';

export type TableGroupShareProps = {
  readonly columnKey: string;
  /** The aggregate's raw value, exactly as the read produced it. */
  readonly value: TableGroupAggregateValue['value'];
};
