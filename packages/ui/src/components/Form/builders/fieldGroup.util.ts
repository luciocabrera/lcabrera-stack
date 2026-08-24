import type { FieldNode } from '#ui/components/Form/Form.types';

export type FieldGroupArgs<TValues extends Record<string, unknown>> = {
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly fields: readonly FieldNode<TValues>[];
  readonly label: string;
};

export const fieldGroup = <TValues extends Record<string, unknown>>({
  collapsible,
  defaultCollapsed,
  fields,
  label,
}: FieldGroupArgs<TValues>) => ({
  fields,
  label,
  type: 'group' as const,
  ...(collapsible !== undefined && { collapsible }),
  ...(defaultCollapsed !== undefined && { defaultCollapsed }),
});
