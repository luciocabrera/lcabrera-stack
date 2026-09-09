import { buildBillingTab } from './buildBillingTab.util';
import { buildCustomerTab } from './buildCustomerTab.util';
import { buildEditNotesTab } from './buildEditNotesTab.util';
import { buildEditOrderTab } from './buildEditOrderTab.util';
import { buildEditPricingTab } from './buildEditPricingTab.util';
import { buildPaymentTab } from './buildPaymentTab.util';
import { buildProductTab } from './buildProductTab.util';
import { buildShippingTab } from './buildShippingTab.util';
import { toOrderFormFields } from './toOrderFormFields.util';

export const buildEditOrderFormFields = () =>
  toOrderFormFields([
    buildEditOrderTab(),
    buildCustomerTab(),
    buildProductTab(),
    buildEditPricingTab(),
    buildShippingTab(),
    buildBillingTab(),
    buildPaymentTab(),
    buildEditNotesTab(),
  ]);
