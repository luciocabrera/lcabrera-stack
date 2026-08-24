import type { FieldNode } from '#ui/components/Form/Form.types';

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
