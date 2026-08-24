import { enterpriseOrderSchema } from './enterpriseOrders.schema';
import { readOrderFormValues } from './readOrderFormValues.util';

export const parseOrderFormData = (formData: FormData) =>
  enterpriseOrderSchema.safeParse(readOrderFormValues({ formData }));
