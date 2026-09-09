import type { FieldNode } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

export const readOrderFormTabLabels = (
  nodes: readonly FieldNode<EnterpriseOrderValues>[],
) => {
  const [root] = nodes;
  return root?.type === 'tab' ? root.tabs.map((tab) => tab.label) : undefined;
};
