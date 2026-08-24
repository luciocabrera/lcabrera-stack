import type { FieldNode } from '#ui/components/Form/Form.types';

/**
 * A nested `overflow: auto` box still reserves its `scrollbar-gutter`, and those
 * reservations stack: three of them (modal body, this list, the tab panel) cost six gutter
 * widths of inline space to use one.
 */
export const hasScrollOwningChild = <TValues extends Record<string, unknown>>(
  fields: readonly FieldNode<TValues>[],
) => fields.length === 1 && fields[0]?.type === 'tab';
