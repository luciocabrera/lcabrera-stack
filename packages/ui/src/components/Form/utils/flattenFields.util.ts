import type { FieldNode, LeafFieldDef } from '#ui/components/Form/Form.types';

export const flattenFields = <TValues extends Record<string, unknown>>(
  fields: readonly FieldNode<TValues>[],
  // explicit return type required: the function is recursive, inference fails
): readonly LeafFieldDef<TValues>[] => {
  return fields.flatMap((field): readonly LeafFieldDef<TValues>[] => {
    switch (field.type) {
      case 'group':
      case 'row': {
        return flattenFields(field.fields);
      }
      case 'tab': {
        return field.tabs.flatMap((tab) => flattenFields(tab.fields));
      }
      default: {
        return [field];
      }
    }
  });
};
