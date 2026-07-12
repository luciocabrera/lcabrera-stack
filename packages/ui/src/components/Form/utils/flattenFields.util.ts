import type {
  FieldNode,
  LeafFieldDef,
} from '@repo/ui/components/Form/Form.types';

/**
 * Single recursive walker for the group/row/tab field tree. Reused by
 * getInitialValues/validateFields/isFormDirty so the recursion exists in
 * exactly one place instead of being reimplemented per consumer.
 */
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
