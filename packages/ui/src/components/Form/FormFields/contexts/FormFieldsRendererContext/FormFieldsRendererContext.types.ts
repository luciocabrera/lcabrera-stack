import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';
import type { ReactNode } from 'react';

/**
 * Erased at the context boundary the same way `AnyFieldComponent` erases
 * leaf field components (see `FormField.constants.ts`) — callers narrow
 * back via their own concrete `TValues` at the call site.
 */
export type RenderFieldsFn = (
  fields: readonly FieldNode<Record<string, unknown>>[],
) => ReactNode;
