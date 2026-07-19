import type { FieldNode } from '@repo/ui/components/Form';

import type { EnterpriseOrderValues } from './config';

export type OrderGroupArgs = {
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly fields: readonly FieldNode<EnterpriseOrderValues>[];
  readonly label: string;
};

/**
 * Build a card group section, including the `collapsible` / `defaultCollapsed`
 * flags only when provided.
 */
export const orderGroup = ({
  collapsible,
  defaultCollapsed,
  fields,
  label,
}: OrderGroupArgs) => ({
  fields,
  label,
  type: 'group' as const,
  ...(collapsible !== undefined && { collapsible }),
  ...(defaultCollapsed !== undefined && { defaultCollapsed }),
});
