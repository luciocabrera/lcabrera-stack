import type { FieldNode } from '#ui/components/Form/Form.types';

export type FieldRowArgs<TValues extends Record<string, unknown>> = {
  readonly fields: readonly FieldNode<TValues>[];
  readonly spans?: readonly number[];
};

export const fieldRow = <TValues extends Record<string, unknown>>({
  fields,
  spans,
}: FieldRowArgs<TValues>) =>
  spans === undefined
    ? { fields, type: 'row' as const }
    : { fields, spans, type: 'row' as const };
