import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';

export type FieldGroupArgs<TValues extends Record<string, unknown>> = {
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly fields: readonly FieldNode<TValues>[];
  readonly label: string;
};

/**
 * Build a card group section, including the `collapsible` / `defaultCollapsed`
 * flags only when provided.
 */
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
