import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';

export type FormFieldsListProps<TValues extends Record<string, unknown>> = {
  readonly fields: readonly FieldNode<TValues>[];
};
