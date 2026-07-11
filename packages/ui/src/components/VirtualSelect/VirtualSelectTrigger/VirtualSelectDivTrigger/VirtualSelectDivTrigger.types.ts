import type { ReactNode } from 'react';

import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger.types';

/**
 * Props for the div-based trigger shell: the parent trigger props that drive
 * interaction and styling, plus the already-rendered trigger children
 * (content and chevron).
 */
export type VirtualSelectDivTriggerProps = Pick<
  VirtualSelectTriggerProps,
  'isAlwaysOpen' | 'isOpen' | 'listboxId' | 'mode' | 'onToggle' | 'triggerRef'
> & {
  readonly children: ReactNode;
  readonly isBusy: boolean;
};
