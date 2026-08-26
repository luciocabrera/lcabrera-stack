import type { EnterpriseOrderInput } from './enterpriseOrders.schema';

import { formatOrderNumber } from './formatOrderNumber.util';
import { toOrderColumnValues } from './toOrderColumnValues.util';

export type ToOrderInsertValuesArgs = {
  readonly actor: string;
  readonly input: EnterpriseOrderInput;
  readonly now: Date;
  readonly orderId: number;
};

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
