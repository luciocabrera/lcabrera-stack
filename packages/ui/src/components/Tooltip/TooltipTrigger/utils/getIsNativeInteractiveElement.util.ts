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

export const getIsNativeInteractiveElement = (node: ReactNode) =>
  isValidElement(node) &&
  typeof node.type === 'string' &&
  NATIVE_INTERACTIVE_TAGS.has(node.type);
