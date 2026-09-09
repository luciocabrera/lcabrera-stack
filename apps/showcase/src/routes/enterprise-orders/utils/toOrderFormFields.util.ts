import type { FieldNode } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

type OrderFormTab = {
  readonly fields: readonly FieldNode<EnterpriseOrderValues>[];
  readonly label: string;
};

export const toOrderFormFields = (tabs: readonly OrderFormTab[]) =>
  [
    {
      tabs,
      type: 'tab',
    },
  ] satisfies readonly FieldNode<EnterpriseOrderValues>[];
