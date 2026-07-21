import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';

import { collectAccessors } from './collectAccessors.util';

/**
 * Builds a stable React key for a field node from its `type` and the joined
 * accessors of its leaf descendants — avoids array-index keys for group/row/
 * tab containers that have no id of their own.
 */
export const getFieldKey = <TValues extends Record<string, unknown>>(
  node: FieldNode<TValues>,
) => `${node.type}:${collectAccessors(node).join('|')}`;
