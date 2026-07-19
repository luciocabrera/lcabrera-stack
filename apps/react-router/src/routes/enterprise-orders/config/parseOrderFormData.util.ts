import { enterpriseOrderSchema } from './enterpriseOrders.schema';
import { readOrderFormValues } from './readOrderFormValues.util';

/**
 * Read an order submission from FormData and validate it against the shared
 * schema in one step. Pure (FormData reads and `safeParse` are side-effect
 * free), so the same call gates both the browser `clientAction` and the
 * server `action`.
 */
export const parseOrderFormData = (formData: FormData) =>
  enterpriseOrderSchema.safeParse(readOrderFormValues({ formData }));
