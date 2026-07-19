import type { EnterpriseOrderInput } from './enterpriseOrders.schema';

import { formatOrderNumber } from './formatOrderNumber.util';
import { toOrderColumnValues } from './toOrderColumnValues.util';

export type ToOrderInsertValuesArgs = {
  /** Value recorded in `last_modified_by` (auth actor, or the system fallback). */
  readonly actor: string;
  readonly input: EnterpriseOrderInput;
  /** Timestamp for `created_at`/`updated_at`/`order_timestamp` — passed in to keep this pure. */
  readonly now: Date;
  /** Pre-assigned primary key (`getMaxValue` + 1). */
  readonly orderId: number;
};

/**
 * Build the full column→value record for an INSERT: the shared editable +
 * computed columns plus the server-assigned identity (`order_id`,
 * `order_number`) and audit columns (`order_timestamp`, `created_at`,
 * `updated_at`, `last_modified_by`).
 */
export const toOrderInsertValues = ({
  actor,
  input,
  now,
  orderId,
}: ToOrderInsertValuesArgs) => {
  const timestamp = now.toISOString();

  return {
    ...toOrderColumnValues({ input }),
    created_at: timestamp,
    last_modified_by: actor,
    order_id: orderId,
    order_number: formatOrderNumber(orderId),
    order_timestamp: timestamp,
    updated_at: timestamp,
  };
};
