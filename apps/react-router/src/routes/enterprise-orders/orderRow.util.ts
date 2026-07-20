import type { FieldNode } from '@repo/ui/components/Form';

import type { EnterpriseOrderValues } from './config';

export type OrderRowArgs = {
  readonly fields: readonly FieldNode<EnterpriseOrderValues>[];
  readonly spans?: readonly number[];
};

// TODO: Consider moving this util to the shared `@repo/ui` package, since it is used in multiple apps.
// make sure we make it generic enough to be used in other apps, not just enterprise-orders

/** Build a row container, including `spans` only when provided. */
export const orderRow = ({ fields, spans }: OrderRowArgs) =>
  spans === undefined
    ? { fields, type: 'row' as const }
    : { fields, spans, type: 'row' as const };
