import type { RowFieldNode } from '@repo/ui/components/Form/Form.types';

export type FormFieldRowProps<TValues extends Record<string, unknown>> = {
  readonly field: RowFieldNode<TValues>;
};
