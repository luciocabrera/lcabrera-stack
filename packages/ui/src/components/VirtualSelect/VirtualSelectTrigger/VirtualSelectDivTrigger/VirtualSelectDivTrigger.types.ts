import type { ReactNode } from 'react';

import type { VirtualSelectTriggerRef } from '../VirtualSelectTrigger.types';

/**
 * Props for the div-based trigger shell — only the producer→direct-child
 * trigger ref and the already-rendered children (content and chevron);
 * interaction and styling state is store-connected inside.
 */
export type VirtualSelectDivTriggerProps = {
  readonly children: ReactNode;
  readonly triggerRef: VirtualSelectTriggerRef;
};
