import { TABLE_MEASURE_AGGREGATE_SCOPE_LABEL } from '#ui/components/Table/Table.constants';

type ResolveMeasureAggregateTitleArgs = {
  readonly isMeasure: boolean;
  readonly target: 'clear' | 'function';
};

export const resolveMeasureAggregateTitle = ({
  isMeasure,
  target,
}: ResolveMeasureAggregateTitleArgs) => {
  if (!isMeasure) return;

  return target === 'clear'
    ? `Clears every measure in the band: ${TABLE_MEASURE_AGGREGATE_SCOPE_LABEL}.`
    : `Applies to the whole band: ${TABLE_MEASURE_AGGREGATE_SCOPE_LABEL}.`;
};
