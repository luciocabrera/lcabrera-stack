import type { FieldNode } from '@repo/ui/components/Form';

import type { EnterpriseOrderValues } from './config';

export type OrderGroupArgs = {
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly fields: readonly FieldNode<EnterpriseOrderValues>[];
  readonly label: string;
};

// TODO: Consider moving this util to the shared `@repo/ui` package, since it is used in multiple apps.
// make sure we make it generic enough to be used in other apps, not just enterprise-orders

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
