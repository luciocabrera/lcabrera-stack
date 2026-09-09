import type { FieldNode } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { buildBillingTab } from './buildBillingTab.util';
import { buildCustomerTab } from './buildCustomerTab.util';
import { buildPaymentTab } from './buildPaymentTab.util';
import { buildProductTab } from './buildProductTab.util';
import { buildShippingTab } from './buildShippingTab.util';

type OrderFormTab = {
  readonly fields: readonly FieldNode<EnterpriseOrderValues>[];
  readonly label: string;
};

type ToOrderFormFieldsArgs = {
  readonly notesTab: OrderFormTab;
  readonly orderTab: OrderFormTab;
  readonly pricingTab: OrderFormTab;
};

export const toOrderFormFields = ({
  notesTab,
  orderTab,
  pricingTab,
}: ToOrderFormFieldsArgs) =>
  [
    {
      tabs: [
        orderTab,
        buildCustomerTab(),
        buildProductTab(),
        pricingTab,
        buildShippingTab(),
        buildBillingTab(),
        buildPaymentTab(),
        notesTab,
      ],
      type: 'tab',
    },
  ] satisfies readonly FieldNode<EnterpriseOrderValues>[];
