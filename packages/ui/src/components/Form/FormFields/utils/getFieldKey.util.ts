import type { FieldNode } from '#ui/components/Form/Form.types';

import { collectAccessors } from './collectAccessors.util';

export const getFieldKey = <TValues extends Record<string, unknown>>(
  node: FieldNode<TValues>,
) => `${node.type}:${collectAccessors(node).join('|')}`;
