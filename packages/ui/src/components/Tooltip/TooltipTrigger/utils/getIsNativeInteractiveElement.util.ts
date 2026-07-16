import type { ReactNode } from 'react';

import { isValidElement } from 'react';

const NATIVE_INTERACTIVE_TAGS: ReadonlySet<string> = new Set([
  'a',
  'button',
  'input',
  'select',
  'summary',
  'textarea',
]);

/**
 * Checks whether a React node renders a natively interactive HTML element
 * (link, button, form control) that already provides its own focus and
 * keyboard semantics, so the tooltip trigger must not add `role`/`tabIndex`.
 */
export const getIsNativeInteractiveElement = (node: ReactNode) =>
  isValidElement(node) &&
  typeof node.type === 'string' &&
  NATIVE_INTERACTIVE_TAGS.has(node.type);
