import type { FieldNode } from '#ui/components/Form/Form.types';

/**
 * Collects every leaf `accessor` beneath a node. Accessors are unique keys of
 * `TValues`, so the joined result is a stable, content-derived identity for
 * group/row/tab containers that have no id of their own.
 */
export const collectAccessors = <TValues extends Record<string, unknown>>(
  node: FieldNode<TValues>,
): readonly string[] => {
  switch (node.type) {
    case 'group':
    case 'row': {
      return node.fields.flatMap((child) => collectAccessors(child));
    }
    case 'tab': {
      return node.tabs.flatMap((tab) =>
        tab.fields.flatMap((child) => collectAccessors(child)),
      );
    }
    default: {
      return [node.accessor];
    }
  }
};
