import type { FieldNode } from '@repo/ui/components/Form';

import type { EnterpriseOrderValues } from './config';

export type OrderRowArgs = {
  readonly fields: readonly FieldNode<EnterpriseOrderValues>[];
  readonly spans?: readonly number[];
};

/** Build a row container, including `spans` only when provided. */
export const orderRow = ({ fields, spans }: OrderRowArgs) =>
  spans === undefined
    ? { fields, type: 'row' as const }
    : { fields, spans, type: 'row' as const };
