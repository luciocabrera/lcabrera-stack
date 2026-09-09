import { buildBillingTab } from './buildBillingTab.util';
import { buildCreateNotesTab } from './buildCreateNotesTab.util';
import { buildCreateOrderTab } from './buildCreateOrderTab.util';
import { buildCreatePricingTab } from './buildCreatePricingTab.util';
import { buildCustomerTab } from './buildCustomerTab.util';
import { buildPaymentTab } from './buildPaymentTab.util';
import { buildProductTab } from './buildProductTab.util';
import { buildShippingTab } from './buildShippingTab.util';
import { toOrderFormFields } from './toOrderFormFields.util';

export const buildCreateOrderFormFields = () =>
  toOrderFormFields([
    buildCreateOrderTab(),
    buildCustomerTab(),
    buildProductTab(),
    buildCreatePricingTab(),
    buildShippingTab(),
    buildBillingTab(),
    buildPaymentTab(),
    buildCreateNotesTab(),
  ]);
