import type { FieldNode } from '@repo/ui/components/Form/Form.types';

export type FormFieldsListProps<TValues extends Record<string, unknown>> = {
  readonly fields: readonly FieldNode<TValues>[];
};
