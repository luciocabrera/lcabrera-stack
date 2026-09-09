import type { FieldNode } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

export const collectOrderFormAccessors = (
  nodes: readonly FieldNode<EnterpriseOrderValues>[],
): readonly string[] =>
  nodes.flatMap((node) => {
    if (node.type === 'tab') {
      return node.tabs.flatMap((tab) => collectOrderFormAccessors(tab.fields));
    }
    if (node.type === 'group' || node.type === 'row') {
      return collectOrderFormAccessors(node.fields);
    }

    return [node.accessor];
  });
