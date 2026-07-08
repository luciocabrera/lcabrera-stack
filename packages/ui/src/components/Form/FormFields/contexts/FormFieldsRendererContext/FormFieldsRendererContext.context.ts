import { createContext } from 'react';

import type { RenderFieldsFn } from './FormFieldsRendererContext.types';

/**
 * Supplies the recursive `FormFields` render function to `FormFieldGroup`/
 * `FormFieldRow`/`FormFieldTabs` without those modules statically importing
 * `FormFields.component.tsx` — breaks the otherwise-unavoidable import cycle
 * created by the group/row/tab/leaf tree-walker recursing back into its own
 * dispatcher (see `Form/ARCHITECTURE.md`).
 */
export const FormFieldsRendererContext = createContext<
  RenderFieldsFn | undefined
>(undefined);
