import type { FieldNode } from '#ui/components/Form/Form.types';

/**
 * True when the root field list hands its whole height to a single child that
 * scrolls on its own — today a lone `tab` node, whose `TabsContent` panel is
 * the scroll container and exactly fills the list.
 *
 * The root list must then not be a scroll container too. A nested
 * `overflow: auto` box still reserves its `scrollbar-gutter`, and those
 * reservations stack: three of them (modal body, this list, the tab panel)
 * cost six gutter widths of inline space to use one.
 */
export const hasScrollOwningChild = <TValues extends Record<string, unknown>>(
  fields: readonly FieldNode<TValues>[],
) => fields.length === 1 && fields[0]?.type === 'tab';
