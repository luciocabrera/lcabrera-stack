import type { GroupFieldNode } from '@repo/ui/components/Form/Form.types';

export type FormFieldGroupProps<TValues extends Record<string, unknown>> = {
  readonly field: GroupFieldNode<TValues>;
};
