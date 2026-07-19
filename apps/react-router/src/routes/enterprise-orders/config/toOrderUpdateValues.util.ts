import type { EnterpriseOrderInput } from './enterpriseOrders.schema';

import { toOrderColumnValues } from './toOrderColumnValues.util';

export type ToOrderUpdateValuesArgs = {
  /** Value recorded in `last_modified_by` (auth actor, or the system fallback). */
  readonly actor: string;
  readonly input: EnterpriseOrderInput;
  /** Timestamp for `updated_at` — passed in to keep this pure. */
  readonly now: Date;
};

/**
 * Build the column→value record for an UPDATE: the shared editable + computed
 * columns plus a refreshed `updated_at`/`last_modified_by`. The immutable
 * identity columns (`order_id`, `order_number`, `created_at`,
 * `order_timestamp`) are intentionally left untouched.
 */
export const toOrderUpdateValues = ({
  actor,
  input,
  now,
}: ToOrderUpdateValuesArgs) => ({
  ...toOrderColumnValues({ input }),
  last_modified_by: actor,
  updated_at: now.toISOString(),
});
