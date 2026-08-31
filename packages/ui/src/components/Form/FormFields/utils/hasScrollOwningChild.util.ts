import type { FieldNode } from '#ui/components/Form/Form.types';

export const hasScrollOwningChild = <TValues extends Record<string, unknown>>(
  fields: readonly FieldNode<TValues>[],
) => fields.length === 1 && fields[0]?.type === 'tab';
