import type { EnterpriseOrderInput } from './enterpriseOrders.schema';

import { toOrderColumnValues } from './toOrderColumnValues.util';

export type ToOrderUpdateValuesArgs = {
  readonly actor: string;
  readonly input: EnterpriseOrderInput;
  readonly now: Date;
};

export const toOrderUpdateValues = ({
  actor,
  input,
  now,
}: ToOrderUpdateValuesArgs) => ({
  ...toOrderColumnValues({ input }),
  last_modified_by: actor,
  updated_at: now.toISOString(),
});
